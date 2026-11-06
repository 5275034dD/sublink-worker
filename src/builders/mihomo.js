/**
 * 1. 单节点转换为 Mihomo 格式
 */
function convertNodeToMihomo(node) {
    if (!node || !node.type) return null;

    const base = {
        name: node.name,
        server: node.server,
        port: Number(node.port),
    };

    switch (node.type.toLowerCase()) {
        case 'ss':
        case 'shadowsocks':
            return {
                ...base,
                type: 'ss',
                cipher: node.cipher || node.method,
                password: node.password,
                udp: true
            };
        case 'vmess':
            return {
                ...base,
                type: 'vmess',
                uuid: node.uuid,
                alterId: node.alterId || 0,
                cipher: node.cipher || 'auto',
                tls: !!node.tls,
                network: node.network || 'tcp',
                'ws-opts': node.wsOpts || undefined,
                'grpc-opts': node.grpcOpts || undefined
            };
        case 'vless':
            return {
                ...base,
                type: 'vless',
                uuid: node.uuid,
                cipher: 'auto',
                tls: node.tls !== false,
                'skip-cert-verify': node.skipCertVerify || false,
                servername: node.sni || node.servername,
                network: node.network || 'tcp',
                'reality-opts': node.realityOpts || undefined,
                'ws-opts': node.wsOpts || undefined,
                'grpc-opts': node.grpcOpts || undefined
            };
        case 'hysteria2':
        case 'hy2':
            return {
                ...base,
                type: 'hysteria2',
                password: node.password || node.auth,
                tls: true,
                'skip-cert-verify': node.skipCertVerify || false,
                sni: node.sni,
                up: node.up,
                down: node.down
            };
        case 'tuic':
            return {
                ...base,
                type: 'tuic',
                uuid: node.uuid,
                password: node.password,
                'skip-cert-verify': node.skipCertVerify || false,
                sni: node.sni,
                alpn: node.alpn || ['h3'],
                'congestion-controller': 'bbr'
            };
        case 'trojan':
            return {
                ...base,
                type: 'trojan',
                password: node.password,
                tls: true,
                'skip-cert-verify': node.skipCertVerify || false,
                sni: node.sni,
                network: node.network || 'tcp'
            };
        default:
            return null;
    }
}

/**
 * 2. 生成完整的 Mihomo YAML 配置对象
 */
export function generateMihomoConfig(parsedNodes = []) {
    // 过滤并转化合法节点
    const proxies = parsedNodes
        .map(convertNodeToMihomo)
        .filter(Boolean);

    // 提取所有可用的节点名称
    const nodeNames = proxies.map(p => p.name);
    const availableNodes = nodeNames.length > 0 ? nodeNames : ['DIRECT'];

    return {
        port: 7890,
        'socks-port': 7891,
        'allow-lan': true,
        mode: 'rule',
        'log-level': 'info',
        'external-controller': '127.0.0.1:9090',
        
        // DNS 全局优化
        dns: {
            enable: true,
            ipv6: false,
            'enhanced-mode': 'fake-ip',
            'fake-ip-range': '198.18.0.1/16',
            'default-nameserver': ['119.29.29.29', '223.5.5.5'],
            nameserver: [
                'https://doh.pub/dns-query',
                'https://dns.alidns.com/dns-query'
            ],
            fallback: [
                'https://1.1.1.1/dns-query',
                'https://dns.google/dns-query'
            ],
            'fallback-filter': {
                geoip: true,
                geoip-code: 'CN',
                ipcidr: ['240.0.0.0/4']
            }
        },

        // 代理节点列表
        proxies: proxies,

        // 策略组定义
        'proxy-groups': [
            {
                name: '🚀 节点选择',
                type: 'select',
                proxies: ['⚡ 自动选择', '🎯 直连', ...availableNodes]
            },
            {
                name: '⚡ 自动选择',
                type: 'url-test',
                url: 'http://www.gstatic.com/generate_204',
                interval: 300,
                tolerance: 50,
                proxies: availableNodes
            },
            {
                name: '🤖 AI 服务',
                type: 'select',
                proxies: ['🚀 节点选择', '⚡ 自动选择', ...availableNodes]
            },
            {
                name: '🐱 GitHub',
                type: 'select',
                proxies: ['🚀 节点选择', '🎯 直连', '⚡ 自动选择', ...availableNodes]
            },
            {
                name: '📲 Telegram',
                type: 'select',
                proxies: ['🚀 节点选择', '⚡ 自动选择', ...availableNodes]
            },
            {
                name: '🎬 境外媒体',
                type: 'select',
                proxies: ['🚀 节点选择', '⚡ 自动选择', ...availableNodes]
            },
            {
                name: '🍎 苹果服务',
                type: 'select',
                proxies: ['🎯 直连', '🚀 节点选择']
            },
            {
                name: '🎯 直连',
                type: 'select',
                proxies: ['DIRECT', '🚀 节点选择']
            },
            {
                name: '🛑 广告拦截',
                type: 'select',
                proxies: ['REJECT', 'DIRECT']
            },
            {
                name: '🐟 漏网之鱼',
                type: 'select',
                proxies: ['🚀 节点选择', '⚡ 自动选择', '🎯 直连']
            }
        ],

        // 规则集配置
        rules: [
            'GEOIP,private,🎯 直连,no-resolve',
            'GEOSITE,private,🎯 直连',
            'GEOSITE,category-ads-all,🛑 广告拦截',

            // AI 服务分流
            'GEOSITE,openai,🤖 AI 服务',
            'GEOSITE,claude,🤖 AI 服务',
            'GEOSITE,category-ai-chat-us,🤖 AI 服务',

            // GitHub 独立分流
            'GEOSITE,github,🐱 GitHub',

            // 其他常规分流
            'GEOSITE,telegram,📲 Telegram',
            'GEOSITE,youtube,🎬 境外媒体',
            'GEOSITE,netflix,🎬 境外媒体',
            'GEOSITE,bilibili,🎯 直连',
            'GEOSITE,apple,🍎 苹果服务',
            'GEOSITE,gfw,🚀 节点选择',
            'GEOSITE,cn,🎯 直连',
            'GEOIP,CN,🎯 直连',
            'MATCH,🐟 漏网之鱼'
        ]
    };
}
