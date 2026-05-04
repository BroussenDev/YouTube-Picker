async function startPickingProcess() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('picker')) return;

    const filterType = params.get('maxdate');
    let tries = 0;

    const findVideos = setInterval(async () => {
        tries++;
        const rawLinks = document.querySelectorAll('a[href*="/watch?v="]');
        let pool = [];

        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const data = await chrome.storage.local.get(['videoBlacklist']);
        let blacklist = data.videoBlacklist || [];
        blacklist = blacklist.filter(item => (now - item.timestamp) < oneHour);

        for (let i = 0; i < rawLinks.length; i++) {
            const a = rawLinks[i];
            if (a.innerText.length < 10) continue;

            const videoId = new URL(a.href).searchParams.get('v');
            const box = a.closest('ytd-rich-item-renderer, ytd-grid-video-renderer') || a.parentElement;
            const text = box ? box.innerText.toLowerCase() : "";
            
            let isOk = true;
            if (filterType === 'year' && (text.includes('an') || text.includes('ans'))) {
                isOk = false;
            } else if (filterType === '2years' && /(3|4|5|6|7|8|9|10)\s+ans/.test(text)) {
                isOk = false;
            } else if (filterType === '3years' && /(4|5|6|7|8|9|10)\s+ans/.test(text)) {
                isOk = false;
            }

            // Vérification si déjà dans la blacklist
            const isBlacklisted = blacklist.some(b => b.id === videoId);

            if (isOk && !isBlacklisted && !pool.some(v => v.id === videoId)) {
                pool.push({ id: videoId, url: a.href });
            }
        }

        if (pool.length >= 1) {
            clearInterval(findVideos);
            const selected = pool[Math.floor(Math.random() * pool.length)];

            blacklist.push({ id: selected.id, timestamp: now });
            await chrome.storage.local.set({ videoBlacklist: blacklist });

            window.location.replace(selected.url);
        }

        if (tries > 40) {
            clearInterval(findVideos);
            console.log("YouTube Picker : Aucune nouvelle vidéo trouvée.");
        }
    }, 500);
}

function addPickerBtn() {
    const topBar = document.querySelector('#buttons.ytd-masthead');
    if (topBar && !document.getElementById('yt-picker-home-btn')) {
        const myBtn = document.createElement('button');
        myBtn.id = 'yt-picker-home-btn';
        myBtn.innerHTML = '🎲';
        myBtn.title = "Lancer une vidéo au hasard (Broussen)";
        myBtn.style.cssText = "background:#272727;border:1px solid #3f3f3f;color:white;border-radius:20px;padding:0 15px;margin-right:10px;height:36px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:9999;";

        myBtn.onclick = () => {
            chrome.storage.local.get(["myChannels", "timeFilter"], (res) => {
                const list = (res.myChannels || []).filter(c => c.checked);
                if (list.length === 0) return alert("Coche des chaînes dans l'extension !");
                
                const lucky = list[Math.floor(Math.random() * list.length)];
                const limit = res.timeFilter || 'all';
                let goUrl = "https://www.youtube.com/@" + lucky.handle + "/videos?picker=true";
                
                if (limit !== 'all') goUrl += "&maxdate=" + limit;
                
                window.location.assign(goUrl);
            });
        };
        topBar.prepend(myBtn);
    }
}

window.addEventListener('yt-navigate-finish', () => {
    startPickingProcess();
    addPickerBtn();
});

startPickingProcess();
addPickerBtn();
setInterval(addPickerBtn, 2000);