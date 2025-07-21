use serde::Serialize;

#[derive(Serialize)]
pub struct Response<T> {
    pub code: i32,
    pub data: Option<T>,
    pub message: String,
}

impl<T> Response<T> {
    pub fn success(data: T) -> Self {
        Self {
            code: 0,
            data: Some(data),
            message: "success".to_string(),
        }
    }

    pub fn error(msg: impl Into<String>) -> Self {
        Self {
            code: -1,
            data: None,
            message: msg.into(),
        }
    }

    // 添加自定义状态码的方法
    #[allow(dead_code)]
    pub fn new(code: i32, data: Option<T>, msg: impl Into<String>) -> Self {
        Self {
            code,
            data,
            message: msg.into(),
        }
    }
}

use std::fmt::Display;

impl<T, E: Display> From<Result<T, E>> for Response<T> {
    fn from(result: Result<T, E>) -> Self {
        match result {
            Ok(data) => Response::success(data),
            Err(e) => Response::error(e.to_string()),
        }
    }
}

// 改为同步函数，接收已完成的 Result
pub fn wrap_result<T, E: std::fmt::Debug>(
    result: Result<T, E>,
) -> Result<Response<T>, Response<E>> {
    match result {
        Ok(data) => Ok(Response::success(data)),
        Err(err) => {
            let msg = format!("{:?}", err);
            Ok(Response::error(msg))
        }
    }
}

// 宏保持不变，但使用时需要确保传入的是已完成的 Result
#[macro_export]
macro_rules! result_response {
    ($expr:expr) => {
        crate::utils::response::wrap_result($expr)
    };
}
