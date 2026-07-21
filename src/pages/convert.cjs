const fs = require('fs');

const htmlPath = 'C:/Users/Abcom/Downloads/loyalty_admin_v1.html';
const content = fs.readFileSync(htmlPath, 'utf8');

const styleMatch = content.match(/<style>([\s\S]*?)<\/style>/);
const css = styleMatch ? styleMatch[1] : '';

const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
let js = scriptMatch ? scriptMatch[1] : '';

// Make all top-level functions global so they can be called from inline onClick
js = js.replace(/function (switchChart|switchTab|toggleFilter|setDFMode|applyDF|resetDF|setPreset|aiSug|sendAI|toggleAI|closeDrill|openDrill|showToast|setModeBtn|updateFilterLabel|syncNavLink|applyIncomingFilter|buildGenericDrill|addMsg|showTyping|finishTyping|callAPI|getBotFallback)\b/g, 'window.$1 = function $1');
js = js.replace(/let dfActivePreset/g, 'window.dfActivePreset');
js = js.replace(/const CD=/g, 'window.CD=');
js = js.replace(/const CI={}/g, 'window.CI={}');
js = js.replace(/const DRILLS=/g, 'window.DRILLS=');
js = js.replace(/let drillStack/g, 'window.drillStack');
js = js.replace(/let aiOpen/g, 'window.aiOpen');
js = js.replace(/let chatHistory/g, 'window.chatHistory');
js = js.replace(/let typingEl/g, 'window.typingEl');

const bodyMatch = content.match(/<body>([\s\S]*?)<\/body>/);
let bodyHtml = bodyMatch ? bodyMatch[1] : '';
bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/g, '');

let jsx = bodyHtml;
jsx = jsx.replace(/<img([^>]*[^\/])>/g, '<img$1 />');
jsx = jsx.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
jsx = jsx.replace(/<br>/g, '<br />');
jsx = jsx.replace(/<hr>/g, '<hr />');
jsx = jsx.replace(/<path ([^>]+)>/g, '<path $1 />');

jsx = jsx.replace(/class="/g, 'className="');

jsx = jsx.replace(/onclick="([^"]+)"/g, (match, p1) => {
    let code = p1;
    code = code.replace(/this/g, 'event.currentTarget');
    return `onClick={(event) => { ${code} }}`;
});

jsx = jsx.replace(/onkeydown="([^"]+)"/g, (match, p1) => {
    let code = p1;
    return `onKeyDown={(event) => { ${code} }}`;
});

jsx = jsx.replace(/style="([^"]+)"/g, (match, p1) => {
    const styles = p1.split(';').filter(s => s.trim()).map(s => {
        let [key, val] = s.split(':');
        if (!key || !val) return '';
        key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        val = val.trim();
        return `${key}: "${val}"`;
    }).join(', ');
    return `style={{ ${styles} }}`;
});

jsx = jsx.replace(/href="loyalty_spoc_v4\.html"/g, 'onClick={(e) => { e.preventDefault(); navigate("/loyalty/dashboard"); }} href="#"');
jsx = jsx.replace(/viewBox/g, 'viewBox');
jsx = jsx.replace(/stroke-width/g, 'strokeWidth');
jsx = jsx.replace(/<!--[\s\S]*?-->/g, '');

const componentCode = `
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoyaltyDashboardNew.css';

export const LoyaltyDashboardNew = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";
    script.async = true;
    
    script.onload = () => {
      ${js}
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      ${jsx}
    </>
  );
};

export default LoyaltyDashboardNew;
`;

fs.writeFileSync('c:/Projects/hi-society-repo/src/pages/LoyaltyDashboardHtml.css', css);
fs.writeFileSync('c:/Projects/hi-society-repo/src/pages/LoyaltyDashboardHtml.tsx', componentCode.replace(/LoyaltyDashboardNew/g, 'LoyaltyDashboardHtml'));
console.log('Conversion complete!');
