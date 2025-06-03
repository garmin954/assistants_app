use serde::Serialize;

#[derive(Serialize)]
pub struct Response<T> {
    pub code: i32,
    pub data: Option<T>,
    pub msg: String,
}
#[allow(dead_code)]
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


}