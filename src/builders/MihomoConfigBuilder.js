import yaml from 'js-yaml';
import { ClashConfigBuilder } from './ClashConfigBuilder.js';

/**
 * Mihomo (Clash Meta) 配置生成器
 * 继承 ClashConfigBuilder，自动保留节点解析、去重、国家分组及代理提供者（Provider）逻辑
 * 扩展支持：Fake-IP DNS 优化、AI 服务与 GitHub 专属策略组及 GEOSITE 分流
 */
export class MihomoConfigBuilder extends ClashConfigBuilder {
    constructor(
        inputString,
        selectedRules,
        customRules,
        baseConfig,
        lang,
        userAgent = 'mihomo',
        groupByCountry = false,
        enableClashUI = false,
        externalController,
        externalUiDownloadUrl,
        includeAutoSelect = true
    ) {
        super(
            inputString,
            selectedRules,
            customRules,
            baseConfig,
            lang,
            userAgent,
            groupByCountry,
            enableClashUI,
            externalController,
            externalUiDownloadUrl,
            includeAutoSelect
        );
    }

    /**
     * 格式化并输出 Mihomo YAML 配置文件
     */
    formatConfig() {
        // 1. 注入适配 Mihomo 的 Fake-IP DNS 配置
        if (this.config) {
            this.config.dns = {
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
                    'geoip-code': 'CN',
                    ipcidr: ['240.0.0.0/4']
                },
                ...(this.config.dns || {})
            };
        }

        // 2. 调用父类逻辑，生成基础节点与全局策略组
        super.formatConfig();

        // 3. 获取可用节点与代理提供者（Providers）
        this.config['proxy-groups'] = this.config['proxy-groups'] || [];
        const proxyList = typeof this.getProxyList === 'function' ? this.getProxyList() : [];
        const selectMembers = typeof this.buildSelectGroupMembers === 'function' 
            ? this.buildSelectGroupMembers(proxyList) 
            : ['DIRECT'];
        const providerNames = typeof this.getAllProviderNames === 'function' 
            ? this.getAllProviderNames() 
            : [];

        // 4. 动态插入 🤖 AI 服务 策略组
        const hasAiGroup = this.config['proxy-groups'].some(g => g && g.name === '🤖 AI 服务');
        if (!hasAiGroup) {
            const aiGroup = {
                type: 'select',
                name: '🤖 AI 服务',
                proxies: [...selectMembers]
            };
            if (providerNames.length > 0) aiGroup.use = providerNames;
            // 插入到前端策略组后
            this.config['proxy-groups'].splice(1, 0, aiGroup);
        }

        // 5. 动态插入 🐱 GitHub 策略组
        const hasGithubGroup = this.config['proxy-groups'].some(g => g && g.name === '🐱 GitHub');
        if (!hasGithubGroup) {
            const githubGroup = {
                type: 'select',
                name: '🐱 GitHub',
                proxies: [...selectMembers]
            };
            if (providerNames.length > 0) githubGroup.use = providerNames;
            this.config['proxy-groups'].splice(2, 0, githubGroup);
        }

        // 6. 注入 AI 与 GitHub 专属 GEOSITE 分流规则
        if (Array.isArray(this.config.rules)) {
            const mihomoRules = [
                'GEOSITE,openai,🤖 AI 服务',
                'GEOSITE,claude,🤖 AI 服务',
                'GEOSITE,category-ai-chat-us,🤖 AI 服务',
                'GEOSITE,github,🐱 GitHub'
            ];

            // 查找 GFW 或 CN 规则位置，优先插在它们前面
            const insertIndex = this.config.rules.findIndex(
                r => typeof r === 'string' && (r.includes('GEOSITE,gfw') || r.includes('GEOSITE,cn') || r.includes('GEOIP,CN'))
            );

            if (insertIndex !== -1) {
                this.config.rules.splice(insertIndex, 0, ...mihomoRules);
            } else {
                const matchIndex = this.config.rules.findIndex(
                    r => typeof r === 'string' && r.startsWith('MATCH')
                );
                if (matchIndex !== -1) {
                    this.config.rules.splice(matchIndex, 0, ...mihomoRules);
                } else {
                    this.config.rules.push(...mihomoRules);
                }
            }
        }

        // 7. 校验策略组完整性并导出为 YAML 字符串
        this.validateProxyGroups();
        return yaml.dump(this.config);
    }
}
