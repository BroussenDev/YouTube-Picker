chrome.tabs.onUpdated.addListener((id, info, tab) => {
    if (tab.url && tab.url.includes('picker=true')) {
        
        chrome.scripting.executeScript({
            target: { tabId: id },
            func: () => {
                const scanner = setInterval(() => {
                    const items = Array.from(document.querySelectorAll('a#video-title-link'));
                    
                    if (items.length > 5) {
                        clearInterval(scanner);
                        
                        const rdm = Math.floor(Math.random() * (Math.min(items.length, 20) - 5 + 1)) + 5;
                        const target = items[rdm].href;

                        window.location.replace(target);
                    }
                }, 800);
                
                setTimeout(() => clearInterval(scanner), 10000);
            }
        });
    }
});