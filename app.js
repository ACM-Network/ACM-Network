const channels = [
    { name: 'Channel 1', url: 'https://example.com/stream1.m3u8' },
    { name: 'Channel 2', url: 'https://example.com/stream2.m3u8' },
    { name: 'Channel 3', url: 'https://example.com/stream3.m3u8' },
    // Add more channels here
];

const player = document.getElementById('player');
const channelList = document.querySelector('.channel-list');

// Load channels
channels.forEach(channel => {
    const button = document.createElement('button');
    button.textContent = channel.name;
    button.addEventListener('click', () => {
        player.src = channel.url;
        player.play();
    });
    channelList.appendChild(button);
});

// Dark/Light Theme Toggle
const themeSwitch = document.getElementById('theme-switch');
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('light-mode');
});

// Save theme preference in local storage
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    themeSwitch.checked = true;
}

themeSwitch.addEventListener('change', () => {
    if (themeSwitch.checked) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
    }
});
