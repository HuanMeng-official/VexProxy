document.addEventListener('DOMContentLoaded', () => {
    const hostInput = document.getElementById('host');
    const portInput = document.getElementById('port');
    const protocolSelect = document.getElementById('protocol');
    const actionBtn = document.getElementById('action-btn');
    const btnText = document.getElementById('btn-text');

    // 界面元素
    const mainCard = document.getElementById('main-card');
    const statusTitle = document.getElementById('status-title');
    const statusDetail = document.getElementById('status-detail');
    const errorMsg = document.getElementById('error-msg');

    let latencyTag = document.getElementById('latency-tag');

    // 初始化国际化
    function initI18n() {
        const uiLanguage = chrome.i18n.getUILanguage();
        document.documentElement.lang = uiLanguage;
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const messageId = element.getAttribute('data-i18n');
            element.textContent = chrome.i18n.getMessage(messageId);
        });
    }
    initI18n();

    let isProxyOn = false;

    // 检查冲突
    checkConflict();

    // 初始化回显
    chrome.storage.local.get(['proxyHost', 'proxyPort', 'proxyProtocol', 'proxyEnabled'], (result) => {
        if (result.proxyHost) hostInput.value = result.proxyHost;
        if (result.proxyPort) portInput.value = result.proxyPort;
        if (result.proxyProtocol) protocolSelect.value = result.proxyProtocol;

        if (result.proxyEnabled) {
            updateUIState(true);
            checkProxyConnectivity(true);
        } else {
            updateUIState(false);
        }
    });

    // 按钮点击
    actionBtn.addEventListener('click', () => {
        hideError();
        if (isProxyOn) {
            disableProxy();
        } else {
            enableProxy();
        }
    });

    function enableProxy() {
        const host = hostInput.value.trim();
        const port = parseInt(portInput.value.trim());
        const scheme = protocolSelect.value;

        if (!host || isNaN(port)) {
            showError(chrome.i18n.getMessage('checkError'));
            return;
        }

        const config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: { scheme: scheme, host: host, port: port },
                bypassList: ["localhost", "127.0.0.1", "::1", "192.168.*"]
            }
        };

        setLoadingState(true);

        chrome.proxy.settings.set({ value: config, scope: 'regular' }, async () => {
            if (chrome.runtime.lastError) {
                showError(chrome.i18n.getMessage('setupFailed') + chrome.runtime.lastError.message);
                setLoadingState(false);
                return;
            }

            // 测试连接
            try {
                const latency = await checkProxyConnectivity(false);
                chrome.storage.local.set({
                    proxyHost: host,
                    proxyPort: port,
                    proxyProtocol: scheme,
                    proxyEnabled: true
                });

                updateUIState(true);
                updateLatencyUI(latency);

            } catch (error) {
                console.error("Proxy connection failed:", error);
                disableProxy(true);
                showError(chrome.i18n.getMessage('testFailedReverting'));
                updateUIState(false);
            } finally {
                setLoadingState(false);
            }
        });
    }

    async function checkProxyConnectivity(silentMode = false) {
        const start = Date.now();
        const testUrl = 'http://www.google.com/generate_204'; 
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
            await fetch(testUrl, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return Date.now() - start;
        } catch (error) {
            clearTimeout(timeoutId);
            if (!silentMode) {
                throw error;
            }
        }
    }

    function updateLatencyUI(latency) {
        if (!latencyTag) return;
        const successText = chrome.i18n.getMessage('connectionSuccess') || 'Connected';
        latencyTag.textContent = `● ${successText} (${latency}ms)`;
        latencyTag.style.color = "var(--success)";
    }

    // 关闭代理
    function disableProxy(isInternal = false) {
        const config = { mode: "direct" };

        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                console.error("Close failed", chrome.runtime.lastError);
                if (!isInternal) showError(chrome.i18n.getMessage('closeFailed'));
                return;
            }
            chrome.storage.local.set({ proxyEnabled: false });
            
            if (!isInternal) {
                updateUIState(false);
            }
        });
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            actionBtn.disabled = true;
            actionBtn.style.opacity = "0.7";
            btnText.textContent = chrome.i18n.getMessage('connecting');
            latencyTag.textContent = "";
            
            // 锁定输入框
            hostInput.disabled = true;
            portInput.disabled = true;
            protocolSelect.disabled = true;
        } else {
            actionBtn.disabled = false;
            actionBtn.style.opacity = "1";
        }
    }

    function updateUIState(enabled) {
        isProxyOn = enabled;

        if (enabled) {
            mainCard.classList.add('active');
            statusTitle.textContent = chrome.i18n.getMessage('proxyEnabled');
            statusDetail.textContent = `${protocolSelect.value.toUpperCase()}://${hostInput.value}:${portInput.value}`;
            btnText.textContent = chrome.i18n.getMessage('disconnect');
            actionBtn.classList.add('btn-disconnect');
            actionBtn.classList.remove('loading');

            hostInput.disabled = true;
            portInput.disabled = true;
            protocolSelect.disabled = true;
        } else {
            mainCard.classList.remove('active');
            statusTitle.textContent = chrome.i18n.getMessage('proxyDisabled');
            statusDetail.textContent = chrome.i18n.getMessage('directTraffic');
            btnText.textContent = chrome.i18n.getMessage('connectButton');
            actionBtn.classList.remove('btn-disconnect');

            // 状态重置时清空延迟显示
            if (latencyTag) latencyTag.textContent = "";

            hostInput.disabled = false;
            portInput.disabled = false;
            protocolSelect.disabled = false;
        }
    }

    function showError(msg) {
        if (!errorMsg) return;
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        setTimeout(() => {
            errorMsg.style.display = 'none';
        }, 3000);
    }

    function hideError() {
        if (!errorMsg) return;
        errorMsg.style.display = 'none';
    }

    function checkConflict() {
        chrome.proxy.settings.get({ 'incognito': false }, (config) => {
            if (config.levelOfControl === 'controlled_by_other_extension') {
                showError(chrome.i18n.getMessage('warningConflict'));
                actionBtn.disabled = true;
                actionBtn.style.opacity = "0.5";
                btnText.textContent = chrome.i18n.getMessage('permissionOccupied');
            }
        });
    }
});