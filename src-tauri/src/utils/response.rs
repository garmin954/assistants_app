use serde::Serialize;

#[derive(Serialize)]
pub struct Response<T> {
    pub code: i32,
    pub data: Option<T>,
    pub msg: String,
}

impl<T> Response<T> {
    pub fn success(data: T) -> Self {
        Self {
            code: 0,
            data: Some(data),
            msg: "success".to_string(),
        }
    }

    pub fn error(msg: impl Into<String>) -> Self {
        Self {
            code: -1,
            data: None,
            msg: msg.into(),
        }
    }

    // 添加自定义状态码的方法
    pub fn new(code: i32, data: Option<T>, msg: impl Into<String>) -> Self {
        Self {
            code,
            data,
            msg: msg.into(),
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
