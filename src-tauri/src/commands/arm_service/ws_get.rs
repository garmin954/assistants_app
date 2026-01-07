use anyhow::anyhow;
use futures::SinkExt;
use futures::StreamExt;
use serde::Serialize;
use std::error::Error;
use tokio::time::timeout;
use tokio_tungstenite::connect_async;
use url::Url;

#[derive(Serialize, Debug)]
pub struct WSSdkData {
    pub axis: i32,
    pub ft_sensor: bool,
}

/// 连接ws状态
pub async fn ws_connect_state(ip: &str) -> bool {
    let url = Url::parse(format!("ws://{}:18333/ws", ip).as_str());
    if let Err(_) = url {
        return false;
    }

    // 设置超时时间5s
    let duration = std::time::Duration::from_secs(5);
    let conn = timeout(duration, connect_async(url.unwrap()))
        .await
        .map_err(|e| format!("连接失败: {}", e));

    if let Err(_) = conn {
        return false;
    }

    let conn = conn.unwrap();
    if let Err(_) = conn {
        return false;
    }

    // 判断连接是否正常
    let (ws_stream, response) = conn.unwrap();
    println!("服务器响应状态: {:?}", response);

    let (mut write, _) = ws_stream.split();
    if response.status() != 101 {
        return false;
    }

    write.close().await.unwrap();

    true
}

/// 获取ws数据
pub async fn ws_get_data(ip: &str) -> Result<WSSdkData, Box<dyn Error>> {
    let url = Url::parse(
        format!(
            "ws://{}:18333/ws?channel=prod&lang=cn&v=1&id=1752045900705",
            ip
        )
        .as_str(),
    )?;
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

    let mut field_keys: Vec<String> = vec![];

    while let Some(msg) = read.next().await {
        if response_count > 10 {
            break;
        }
        let msg = msg?;

        // 获取响应的 JSON
        let json: serde_json::Value = serde_json::from_str(&msg.to_string())?;

        // devices_status_report
        if let Some(cmd) = json.get("cmd") {
            if cmd == "devices_status_keys_report" {
                let data = json.get("data").unwrap();

                let a = data.as_array().unwrap();
                a.iter().for_each(|item| {
                    field_keys.push(item.as_str().unwrap().to_string());
                });
            }
            if cmd == "devices_status_report" {
                let data = json.get("data").unwrap();
                let ft_sensor_index = field_keys
                    .iter()
                    .position(|item| item == "ft_sensor")
                    .ok_or_else(|| anyhow!("Missing 'ft_sensor' data"))?;
                let ft_sensor = data.get(ft_sensor_index).unwrap();

                let xarm_axis_index = field_keys
                    .iter()
                    .position(|item| item == "xarm_axis")
                    .ok_or_else(|| anyhow!("Missing 'xarm_axis' data"))?;
                let xarm_axis = data.get(xarm_axis_index).unwrap();

                // Replace the problematic line with proper error handling
                let axis = ft_sensor
                    .get("axis")
                    .and_then(|axis_array| axis_array.get(1))
                    .ok_or_else(|| anyhow!("Missing 'axis' data or insufficient elements"))?;
                let mode = ft_sensor.get("mode").unwrap();

                let open_ft_sensor = axis == 1 && mode == 1;

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
