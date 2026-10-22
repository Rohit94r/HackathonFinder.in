/**
 * Component-scoped CSS. React 18 HTML-escapes text inside <style> during server
 * rendering (quotes, `>`), which breaks hydration, so the CSS goes in as raw HTML.
 */
export function InlineStyle({ css }: { css: string }) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
