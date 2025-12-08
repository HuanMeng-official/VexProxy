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

    // 初始化国际化
    function initI18n() {
        // 设置 HTML lang 属性
        const uiLanguage = chrome.i18n.getUILanguage();
        document.documentElement.lang = uiLanguage;

        // 遍历所有带有 data-i18n 属性的元素并设置文本
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

        btnText.textContent = chrome.i18n.getMessage('connecting');

        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                showError(chrome.i18n.getMessage('setupFailed') + chrome.runtime.lastError.message);
                updateUIState(false);
                return;
            }

            chrome.storage.local.set({
                proxyHost: host,
                proxyPort: port,
                proxyProtocol: scheme,
                proxyEnabled: true
            });

            setTimeout(() => {
                updateUIState(true);
            }, 200);

            checkConflict();
        });
    }

    function disableProxy() {
        const config = { mode: "direct" };

        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                showError(chrome.i18n.getMessage('closeFailed') + chrome.runtime.lastError.message);
                return;
            }
            chrome.storage.local.set({ proxyEnabled: false });
            updateUIState(false);
        });
    }

    function updateUIState(enabled) {
        isProxyOn = enabled;

        if (enabled) {
            mainCard.classList.add('active');
            statusTitle.textContent = chrome.i18n.getMessage('proxyEnabled');
            statusDetail.textContent = `${protocolSelect.value.toUpperCase()}://${hostInput.value}:${portInput.value}`;
            btnText.textContent = chrome.i18n.getMessage('disconnect');
            actionBtn.classList.add('btn-disconnect');

            hostInput.disabled = true;
            portInput.disabled = true;
            protocolSelect.disabled = true;
        } else {
            mainCard.classList.remove('active');
            statusTitle.textContent = chrome.i18n.getMessage('proxyDisabled');
            statusDetail.textContent = chrome.i18n.getMessage('directTraffic');
            btnText.textContent = chrome.i18n.getMessage('connectButton');
            actionBtn.classList.remove('btn-disconnect');

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
        }, 5000);
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