use tauri::AppHandle;

pub fn get_state_data(_rx: &AppHandle) {
    // let app_handle = rx.clone();

    // thread::spawn(move || loop {
    //     let state = app_handle.state::<AppState>();

    //     let mut push_time = state.push_time;
    //     let now_time = Local::now().timestamp_millis();
    //     println!(
    //         "now_time: {:?}- {:?} = {}",
    //         now_time,
    //         push_time,
    //         now_time - push_time
    //     );
    //     if now_time - push_time > 1000 * 5 {
    //         let _ = state.push_shared_state();
    //         push_time = now_time;
    //     }
    //     thread::sleep(Duration::from_secs(100));
    // });
}
