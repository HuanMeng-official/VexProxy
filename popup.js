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
            showError("请检查 IP 和端口是否正确");
            return;
        }

        const config = {
            mode: "fixed_servers",
            rules: {
                singleProxy: { scheme: scheme, host: host, port: port },
                bypassList: ["localhost", "127.0.0.1", "::1", "192.168.*"]
            }
        };

        btnText.textContent = "连接中...";

        chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
            if (chrome.runtime.lastError) {
                showError("设置失败: " + chrome.runtime.lastError.message);
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
                showError("关闭失败: " + chrome.runtime.lastError.message);
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
            statusTitle.textContent = "系统代理已开启";
            statusDetail.textContent = `${protocolSelect.value.toUpperCase()}://${hostInput.value}:${portInput.value}`;
            btnText.textContent = "断开连接";
            actionBtn.classList.add('btn-disconnect');

            hostInput.disabled = true;
            portInput.disabled = true;
            protocolSelect.disabled = true;
        } else {
            mainCard.classList.remove('active');
            statusTitle.textContent = "未连接代理";
            statusDetail.textContent = "所有流量直接通过本地网络传输";
            btnText.textContent = "立即连接";
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
                showError("警告：SwichyOmega 等插件正在占用代理权限！");
                actionBtn.disabled = true;
                actionBtn.style.opacity = "0.5";
                btnText.textContent = "权限被占用";
            }
        });
    }
});