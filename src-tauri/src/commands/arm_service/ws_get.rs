use serde::Serialize;
use std::error::Error;
use tokio_tungstenite::connect_async;
use url::Url;
// 添加缺失的 trait 导入
use futures_util::stream::StreamExt;
use futures_util::SinkExt; // 关键：导入 StreamExt trait

#[derive(Serialize)]
struct WsRequest {
    id: String,
    cmd: String,
    data: std::collections::HashMap<String, String>,
}

#[derive(Serialize)]
pub struct WSSdkData {
    pub axis: i32,
    pub ft_sensor: bool,
}

pub async fn ws_get_data() -> Result<WSSdkData, Box<dyn Error>> {
    let url = Url::parse("ws://192.168.1.68:18333/ws?channel=prod&lang=cn&v=1&id=1752045900705")?;
    println!("连接到 WebSocket 服务器: {}", url);

    let (ws_stream, response) = connect_async(url).await?;
    println!("服务器响应状态: {}", response.status());

    let (mut write, mut read) = ws_stream.split();

    // 获取多次的响应结果
    let mut response_count = 0;
    // type report cmd devices_status_report
    println!("等待响应...");

    let mut sdk_data = WSSdkData {
        axis: 0,
        ft_sensor: false,
    };

    while let Some(msg) = read.next().await {
        if response_count > 10 {
            break;
        }
        let msg = msg?;

        // 获取响应的 JSON
        let json: serde_json::Value = serde_json::from_str(&msg.to_string())?;

        // devices_status_report
        if let Some(cmd) = json.get("cmd") {
            if cmd == "devices_status_report" {
                let data = json.get("data").unwrap();
                let ft_sensor = data.get(77).unwrap();
                let axis = ft_sensor.get("axis").unwrap().get(1).unwrap();
                let mode = ft_sensor.get("mode").unwrap();

                let open_ft_sensor = axis == 1 && mode == 1;

                let xarm_axis = data.get(36).unwrap();
                sdk_data.axis = xarm_axis.as_i64().unwrap_or(0) as i32;
                sdk_data.ft_sensor = open_ft_sensor;

                break;
            }
        }
        response_count += 1;
    }

    write.close().await?;
    println!("断开连接");

    Ok(sdk_data)
}
