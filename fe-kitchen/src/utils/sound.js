/**
 * Phát âm thanh chuông thông báo
 * Sử dụng Web Audio API để tạo âm thanh chuông với nhiều harmonics
 * Nếu phương pháp chính thất bại, sẽ thử phương pháp fallback đơn giản hơn
 */
export const playBellSound = () => {
  try {
    // Tạo AudioContext (hỗ trợ cả Chrome và Safari)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Thời lượng âm thanh: 0.5 giây
    const duration = 0.5;
    // Lấy sample rate từ audio context
    const sampleRate = audioContext.sampleRate;
    // Tính số samples cần thiết
    const numSamples = duration * sampleRate;
    // Tạo audio buffer với 1 channel (mono)
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    // Lấy channel data để ghi âm thanh
    const data = buffer.getChannelData(0);
    
    // Tạo sóng âm với nhiều harmonics để tạo âm thanh chuông
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate; // Thời gian tính bằng giây
      const freq1 = 800; // Tần số cơ bản (Hz)
      const freq2 = 1200; // Harmonic thứ 2
      const freq3 = 1600; // Harmonic thứ 3
      // Envelope để tạo hiệu ứng fade out (âm thanh nhỏ dần)
      const envelope = Math.exp(-t * 3);
      // Kết hợp 3 tần số với tỷ lệ khác nhau để tạo âm thanh chuông
      const wave = 
        Math.sin(2 * Math.PI * freq1 * t) * 0.5 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.3 +
        Math.sin(2 * Math.PI * freq3 * t) * 0.2;
      // Áp dụng envelope và lưu vào buffer
      data[i] = wave * envelope;
    }
    
    // Tạo source từ buffer và phát
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    // Đóng audio context sau khi phát xong
    source.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    // Nếu phương pháp chính thất bại, thử phương pháp fallback đơn giản hơn
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Sử dụng oscillator đơn giản thay vì buffer
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      // Tần số 800Hz, dạng sóng sine
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      // Tạo fade out effect
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      // Phát trong 0.5 giây
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (fallbackError) {
      // Nếu cả fallback cũng thất bại, im lặng (không làm gì)
    }
  }
};

/**
 * Hàm test âm thanh chuông
 * Gọi playBellSound để kiểm tra xem âm thanh có hoạt động không
 */
export const testBellSound = () => {
  playBellSound();
};

