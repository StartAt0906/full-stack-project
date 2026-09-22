import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 

export default function AiChatBot() {
    //控制悬浮窗展开/折叠的状态（默认 false 为右下角圆形小球状态）
    const [isOpen, setIsOpen] = useState(false);
    
    const [messages, setMessages] = useState([
        { role: 'ai', text: '你好！我是您的智能金牌导购。我已经读完商城所有商品的实时说明书啦，请问有什么可以帮您？' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);
    const navigate = useNavigate(); // 激活 React Router 跳转

    // 自动平滑滚动到聊天底部
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

                     // 预清洗融合算法，彻底抹平网络分包与随机换行带来的“时对时错”
    const renderMessageText = (text) => {
        if (!text) return '';

        // 1. 彻底斩断大模型所有因网络分包、断包震碎的跨行和空格杂质
        let normalizedText = text
            .replace(/\*\*+/g, '') // 抹除所有的 **
            // 💡 核心缝合机制：用捕获组匹配 "商品"、"ID"、"冒号" 连同后面可能被换行切断的两个数字(\d)\s*(\d)
            // 强行把 "商品\nID: 1\n7" 在底层字符串操作栈里强制融合成连续、完美的 "商品ID:17"！
            .replace(/(商品)\s*(ID)\s*(:?)\s*(\d)\s*(\d?)/gi, (match, p1, p2, p3, p4, p5) => {
                return `商品ID:${p4}${p5}`;
            })
            .replace(/【\s*商品ID/gi, '【商品ID');

        // 2. 此时文本里的 ID 已经被百分之百修复成了绝对连续、无冲突的标准格式 "商品ID:17"
        const regex = /(?:【?商品ID:\s*|🛍️ 查看该商品 \(ID:\s*)(\d+)(?:】)?/gi;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(normalizedText)) !== null) {
            if (match.index > lastIndex) {
                parts.push(normalizedText.substring(lastIndex, match.index));
            }
            const productId = match[1]; 
            
            parts.push(
                <span 
                    key={match.index} 
                    style={styles.productTag}
                    title="点击立即跳转至该商品实物详情页"
                    onClick={() => navigate(`/products/${productId}`)} // 激活 React Router 丝滑重定向
                >
                    🛍️ 点击一键查看商品 (ID: {productId})
                </span>
            );
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < normalizedText.length) {
            parts.push(normalizedText.substring(lastIndex));
        }

        //美化 ### 标题并恢复正文部分的换行显示
        const finalParts = parts.length > 0 ? parts : [normalizedText];
        return finalParts.map((part, i) => {
            if (typeof part === 'string') {
                return part.split('\n').map((line, subIdx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={`${i}-${subIdx}`} style={{ height: '6px' }} />;
                    
                    if (trimmed.startsWith('###')) {
                        return (
                            <h3 key={`${i}-${subIdx}`} style={{ margin: '10px 0 4px 0', fontSize: '15px', color: '#1a73e8', fontWeight: 'bold' }}>
                                📌 {trimmed.replace('###', '').trim()}
                            </h3>
                        );
                    }
                    return <div key={`${i}-${subIdx}`} style={{ minHeight: '20px', lineHeight: '1.6' }}>{trimmed}</div>;
                });
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
        });
    };


    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userText }]);
        setMessages(prev => [...prev, { role: 'ai', text: '' }]);
        setLoading(true);

        try {
            
            const response = await fetch(`http://localhost:8080/api/ai/stream?message=${encodeURIComponent(userText)}`, {
                method: 'GET',
                credentials: 'include' 
            });
            
            if (!response.body) return;
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = ''; 

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                if (readerDone) {
                    done = true;
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                let cleanText = buffer.replace(/^data:/gm, '');
                buffer = ''; 

                if (cleanText) {
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastIndex = updated.length - 1;
                        updated[lastIndex].text += cleanText;
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error('流式读取崩溃:', error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = '抱歉，网络似乎有点小拥堵，请稍后再试。';
                return updated;
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <React.Fragment>
            {/* 🚀 4. 折叠闭合状态：右下角常驻带红点呼吸灯的圆形悬浮球 */}
            {!isOpen && (
                <div style={styles.floatingButton} onClick={() => setIsOpen(true)} title="召唤AI智能导购">
                    <span style={styles.badge}></span>
                    🤖
                </div>
            )}

            {/* 🚀 5. 展开开放状态：右下角优雅滑出完整的聊天导购面板 */}
            {isOpen && (
                <div style={styles.container}>
                    {/* 面板 Header，点击右侧的减号 “—” 可以随时一键折叠折叠 */}
                    <div style={styles.header}>
                        <span>🛒 商城 AI 金牌导购</span>
                        <span style={styles.closeBtn} onClick={() => setIsOpen(false)} title="最小化窗体">➖</span>
                    </div>
                    
                    <div style={styles.chatWindow}>
                        {messages.map((msg, index) => (
                            <div key={index} style={msg.role === 'user' ? styles.userRow : styles.aiRow}>
                                <div style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
                                    {/* 💡 核心渲染调用：如果是 AI 吐出来的字，走我们的智能高亮标签转换逻辑 */}
                                    {msg.role === 'ai' ? renderMessageText(msg.text) : msg.text}
                                    {loading && index === messages.length - 1 && !msg.text && "思考中..."}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div style={styles.inputArea}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="寻找特定特征的商品..."
                            style={styles.input}
                            disabled={loading}
                        />
                        <button onClick={handleSend} style={styles.button} disabled={loading}>
                            发送
                        </button>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
}

// 🎨 融入了工业级 Fixed 定位、呼吸红点、可点击高亮标签的顶级原生 CSS 样式表
const styles = {
    // 右下角悬浮圆形小按钮样式
    floatingButton: { position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', backgroundColor: '#1a73e8', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '28px', color: '#fff', boxShadow: '0 4px 16px rgba(26,115,232,0.3)', cursor: 'pointer', zIndex: 9999 },
    // 提示小红点（自带免打扰呼吸视觉锚点）
    badge: { position: 'absolute', top: '2px', right: '2px', width: '12px', height: '12px', backgroundColor: '#ff4d4f', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 8px #ff4d4f' },
    
    // 聊天主体面板改为右下角固定悬浮 Fixed 布局
    container: { position: 'fixed', bottom: '30px', right: '30px', width: '400px', height: '520px', display: 'flex', flexDirection: 'column', border: '1px solid #e0e0e0', borderRadius: '16px', boxShadow: '0 12px 36px rgba(0,0,0,0.15)', backgroundColor: '#fff', zIndex: 9999, fontFamily: 'sans-serif', overflow: 'hidden' },
    header: { padding: '15px 20px', backgroundColor: '#1a73e8', color: '#fff', fontSize: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { cursor: 'pointer', fontSize: '12px', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)' },
    chatWindow: { flex: 1, padding: '15px', overflowY: 'auto', backgroundColor: '#f7f9fc', display: 'flex', flexDirection: 'column', gap: '12px' },
    userRow: { display: 'flex', justifyContent: 'flex-end' },
    aiRow: { display: 'flex', justifyContent: 'flex-start' },
    userBubble: { padding: '10px 14px', backgroundColor: '#1a73e8', color: '#fff', borderRadius: '16px 16px 2px 16px', maxWidth: '75%', wordBreak: 'break-all', fontSize: '14px', boxShadow: '0 2px 6px rgba(26,115,232,0.15)' },
    aiBubble: { padding: '10px 14px', backgroundColor: '#fff', color: '#333', border: '1px solid #eef2f5', borderRadius: '16px 16px 16px 2px', maxWidth: '75%', wordBreak: 'break-all', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
    
    // 🚀 高阶商品点击跳转标签样式：橙色高亮、带下划线指引、鼠标悬浮变小手
    productTag: { display: 'inline-block', margin: '2px 4px', padding: '3px 8px', backgroundColor: '#fff7e6', color: '#d46b08', border: '1px solid #ffd591', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', textDecoration: 'underline' },
    
    inputArea: { display: 'flex', padding: '12px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' },
    input: { flex: 1, padding: '10px 14px', border: '1px solid #dcdcdc', borderRadius: '20px', outline: 'none', fontSize: '13px', backgroundColor: '#f9f9f9' },
    button: { marginLeft: '8px', padding: '0 16px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }
};
