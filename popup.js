const listElem = document.getElementById('list');
const preview = document.getElementById('preview');
let foundChannel = null;
let timer = null;

const formatHandle = (str) => str.trim().replace('@', '').replace(/\s+/g, '');

async function getChannel(handle) {
    const id = formatHandle(handle);
    if (id.length < 3) return null;

    try {
        const res = await fetch("https://www.youtube.com/@" + id + "?t=" + Date.now());
        if (!res.ok) return null;
        
        const html = await res.text();
        const parser = new DOMParser().parseFromString(html, "text/html");

        const name = parser.querySelector('meta[property="og:title"]')?.content || 
                     parser.querySelector('title')?.innerText.replace(' - YouTube', '');
        
        const pic = parser.querySelector('meta[property="og:image"]')?.content || 
                    parser.querySelector('link[rel="image_src"]')?.href;

        if (name && pic) {
            return { name, handle: id, img: pic };
        }
    } catch (err) {
        console.log("Erreur recherche");
    }
    return null;
}

document.getElementById('new-handle').addEventListener('input', (e) => {
    const txt = e.target.value;
    clearTimeout(timer);
    
    if (txt.length < 3) {
        preview.style.display = 'none';
        return;
    }

    timer = setTimeout(async () => {
        const data = await getChannel(txt);
        if (data) {
            foundChannel = data;
            document.getElementById('preview-name').innerText = data.name;
            document.getElementById('preview-img').src = data.img;
            preview.style.display = 'flex';
        } else {
            preview.style.display = 'none';
        }
    }, 500);
});

function drawList(items) {
    listElem.innerHTML = '';
    for (let i = 0; i < items.length; i++) {
        const ch = items[i];
        const row = document.createElement('div');
        row.className = 'channel-item';
        const checked = ch.checked !== false ? 'checked' : '';

        row.innerHTML = `
            <label style="display:flex; align-items:center; flex:1; gap:12px; cursor:pointer;">
                <input type="checkbox" data-handle="${ch.handle}" ${checked} style="display:none;">
                <div class="custom-checkbox"></div>
                <img src="${ch.img}" class="channel-img">
                <span class="channel-name">${ch.name}</span>
            </label>
            <span class="delete-btn" data-id="${i}">&times;</span>
        `;
        listElem.appendChild(row);
        row.querySelector('input').addEventListener('change', updateStorage);
    }

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            const index = e.target.dataset.id;
            chrome.storage.local.get("myChannels", (res) => {
                let list = res.myChannels || [];
                list.splice(index, 1);
                chrome.storage.local.set({ "myChannels": list }, () => drawList(list));
            });
        };
    });
}

function updateStorage() {
    const all = document.querySelectorAll('.channel-item');
    const toSave = Array.from(all).map(div => {
        const box = div.querySelector('input');
        return {
            name: div.querySelector('.channel-name').innerText,
            handle: box.getAttribute('data-handle'),
            img: div.querySelector('.channel-img').src,
            checked: box.checked
        };
    });
    chrome.storage.local.set({ "myChannels": toSave });
}

chrome.storage.local.get(["myChannels", "timeFilter"], (res) => {
    if (res.myChannels) drawList(res.myChannels);
    if (res.timeFilter) document.getElementById('time-filter').value = res.timeFilter;
});

document.getElementById('time-filter').onchange = (e) => {
    chrome.storage.local.set({ "timeFilter": e.target.value });
};

document.getElementById('add-btn').onclick = () => {
    if (!foundChannel) return;
    chrome.storage.local.get("myChannels", (res) => {
        const list = res.myChannels || [];
        if (list.some(item => item.handle === foundChannel.handle)) {
            return msg("Déjà dans la liste !"); 
        }
        const updated = [{...foundChannel, checked: true}, ...list];
        chrome.storage.local.set({ "myChannels": updated }, () => {
            drawList(updated);
            preview.style.display = 'none';
            document.getElementById('new-handle').value = '';
            msg("Ajouté !");
        });
    });
};

document.getElementById('go').onclick = () => {
    const active = document.querySelectorAll('input[type="checkbox"]:checked');
    const ids = Array.from(active).map(b => b.getAttribute('data-handle'));
    const filter = document.getElementById('time-filter').value;
    
    if (ids.length === 0) return alert("Coche une chaîne !");
    
    const randomId = ids[Math.floor(Math.random() * ids.length)];
    let url = "https://www.youtube.com/@" + randomId + "/videos?picker=true";
    if (filter !== 'all') url += "&maxdate=" + filter;

    window.open(url, '_blank');
};

function msg(text) {
    const toast = document.getElementById('toast');
    toast.innerText = text;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
}