// Application constants
export const APP_NAME = 'Sublink Worker';
export const APP_VERSION = '2.4.2';
export const GITHUB_REPO = 'https://github.com/7Sageer/sublink-worker';
export const GITHUB_API_RELEASES = 'https://api.github.com/repos/7Sageer/sublink-worker/releases/latest';
export const DOCS_URL = 'https://sublink.works';

// SEO and metadata
export const APP_KEYWORDS = 'clash, mihomo, clashmeta, singbox, surge, subscription, converter, sublink';

// Subtitles for different languages
export const APP_SUBTITLE = {
    'zh-CN': '高效聚合与管理您的代理节点',
    'en-US': 'Efficiently Aggregate and Manage Your Proxy Nodes',
    'fa': 'تجمیع و مدیریت کارآمد نودهای پروکسی شما',
    'ru': 'Эффективная агрегация и управление вашими прокси-узлами'
};

// Supported client targets for UI and API validation
export const CLIENT_TYPES = [
    { label: 'Mihomo (Clash Meta)', value: 'mihomo' },
    { label: 'Clash', value: 'clash' },
    { label: 'Sing-Box', value: 'singbox' },
    { label: 'Surge', value: 'surge' },
    { label: 'Shadowrocket', value: 'shadowrocket' },
    { label: 'Quantumult X', value: 'quanx' },
    { label: 'Loon', value: 'loon' }
];

export const SUPPORTED_TARGETS = [
    'mihomo',
    'clashmeta',
    'meta',
    'clash',
    'singbox',
    'surge',
    'shadowrocket',
    'quanx',
    'loon'
];
