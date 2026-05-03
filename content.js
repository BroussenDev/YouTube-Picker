function startPickingProcess() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('picker')) return;

    const filterType = params.get('maxdate');
    let tries = 0;

    const findVideos = setInterval(() => {
        tries++;
        const rawLinks = document.querySelectorAll('a[href*="/watch?v="]');
        let pool = [];

        for (let i = 0; i < rawLinks.length; i++) {
            const a = rawLinks[i];
            if (a.innerText.length < 10) continue;

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

            if (isOk && !pool.includes(a.href)) pool.push(a.href);
        }

        if (pool.length > 2) {
            clearInterval(findVideos);
            const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 10))];
            window.location.replace(pick);
        }

        if (tries > 40) clearInterval(findVideos);
    }, 500);
}

function addPickerBtn() {
    const topBar = document.querySelector('#buttons.ytd-masthead');
    if (topBar && !document.getElementById('yt-picker-home-btn')) {
        const myBtn = document.createElement('button');
        myBtn.id = 'yt-picker-home-btn';
        myBtn.innerHTML = '🎲';
        myBtn.style.cssText = "background:#272727;border:1px solid #3f3f3f;color:white;border-radius:20px;padding:0 15px;margin-right:10px;height:36px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;z-index:9999;";

        myBtn.onclick = () => {
            chrome.storage.local.get(["myChannels", "timeFilter"], (res) => {
                const list = (res.myChannels || []).filter(c => c.checked);
                if (list.length === 0) return alert("Coche des chaînes !");
                
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