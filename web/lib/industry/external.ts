export function parseExternalSource(raw: string) {
    let url: URL;
    try {
        url = new URL(raw);
    }
    catch {
        throw new Error('올바른 URL을 입력해 주세요.');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port)
        throw new Error('인증 정보가 없는 HTTPS 링크를 입력해 주세요.');
    if (url.hostname === 'github.com') {
        const parts = url.pathname.replace(/\/$/, '').split('/').filter(Boolean);
        if (parts.length !== 2 || !parts.every(s => /^[a-zA-Z0-9_.-]+$/.test(s)) || parts.some(s => s === '.' || s === '..'))
            throw new Error('GitHub 저장소 주소를 입력해 주세요.');
        const repo = parts[1].replace(/\.git$/, '');
        return { provider: 'github' as const, url: 'https://github.com/' + parts[0] + '/' + repo, owner: parts[0], repo };
    }
    if (['behance.net', 'www.behance.net'].includes(url.hostname)) {
        const match = url.pathname.match(/^\/gallery\/(\d+)(?:\/[^?#]*)?$/);
        if (!match)
            throw new Error('Behance 프로젝트의 gallery 링크를 입력해 주세요.');
        return { provider: 'behance' as const, url: 'https://www.behance.net/gallery/' + match[1], embed: 'https://www.behance.net/embed/project/' + match[1] + '?ilo0=1' };
    }
    url.hash = '';
    return { provider: 'personal' as const, url: url.toString() };
}
