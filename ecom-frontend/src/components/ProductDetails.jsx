import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; 
import toast from 'react-hot-toast';


import { getProductDetailAction, addToCart } from '../store/actions/index'; 

export default function ProductDetails() {
    const { id } = useParams(); // 捕捉动态 URL 里的 ID (如 17)
    const navigate = useNavigate();
    const dispatch = useDispatch();

    
    const [loader, setLoader] = useState(false);

    
    const product = useSelector(state => state.products?.currentProduct); 

    // 只要 ID 变动，瞬间通过 dispatch 呼叫 index.js 执行异步查库
    useEffect(() => {
        if (id) {
            dispatch(getProductDetailAction(setLoader, id, toast));
        }
    }, [id, dispatch]); 

    // 🚀 3. 完整补回：真正触发生态闭环的购物车添加函数（带铁壁防御 realStock 校验）
    const handleAddToCart = () => {
        if (!product) return;

        // 构建一个完全对齐你 addToCart 动作所需字段的对象结构
        const cartPayload = {
            productId: product.productId,
            productName: product.productName,
            quantity: product.quantity, // 传递当前详情页的实时库存作为防御检索源
            price: product.price
        };

        // 派发购物车 Action，传入打包数据、数量 1 以及 toast 小抄，触发后端 MySQL 真正写入
        dispatch(addToCart(cartPayload, 1, toast));
    };

    // 渲染防卡死加载状态
    if (loader) {
        return <div style={styles.page}><h3>⚡ 正在通过 Redux 状态机从商城仓库调取实时数据...</h3></div>;
    }

    // 防御性拦截：如果数据库里压根没有这个 ID 的商品
    if (!product) {
        return (
            <div style={styles.page}>
                <h3>❌ 抱歉，商城未找到编号为 #{id} 的有效商品。</h3>
                <button 
                    style={{ ...styles.buyBtn, width: '200px' }} 
                    onClick={() => navigate(-1)}
                >
                    返回上页
                </button>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.imgSection}>
                    <span style={{ fontSize: '100px' }}>
                        {product.productName?.includes('鞋') ? '👟' : '📦'}
                    </span>
                   
                    <div style={styles.badge}>🔥 爆款热卖推荐</div>
                </div>

                <div style={styles.infoSection}>
                    <button style={styles.backBtn} onClick={() => navigate(-1)}>⬅️ 返回上页</button>
                    
                    <h1 style={styles.title}>{product.productName}</h1>
                    <p style={styles.meta}>商品编号 (SKU): #{product.productId}</p>
                    
                    <div style={styles.priceTag}>
                        <span style={styles.currency}>￥</span>{product.price}
                    </div>

                    <div style={styles.divider}></div>

                    <h3 style={styles.subTitle}>⚡ 实时商品描述：</h3>
                    <p style={styles.desc}>{product.description}</p>
                    
                    <p style={styles.stock}>📦 当前商城可用实时库存: <strong>{product.quantity} 件</strong></p>

                    
                    <button style={styles.buyBtn} onClick={handleAddToCart}>
                        🛒 立即加入购物车
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { padding: '50px 20px', backgroundColor: '#f4f6f9', minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' },
    card: { display: 'flex', width: '900px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.05)', overflow: 'hidden' },
    imgSection: { flex: 1, backgroundColor: '#f7f9fc', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative', borderRight: '1px solid #f0f0f0', minHeight: '400px' },
    badge: { position: 'absolute', top: '20px', left: '20px', backgroundColor: '#1a73e8', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    infoSection: { flex: 1.2, padding: '40px', display: 'flex', flexDirection: 'column' },
    backBtn: { alignSelf: 'flex-start', border: 'none', backgroundColor: 'transparent', color: '#666', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' },
    title: { fontSize: '26px', color: '#333', fontWeight: 'bold', margin: '0 0 8px 0' },
    meta: { fontSize: '13px', color: '#999', margin: '0 0 20px 0' },
    priceTag: { fontSize: '36px', color: '#ff4d4f', fontWeight: 'bold', margin: '10px 0' },
    currency: { fontSize: '20px' },
    divider: { height: '1px', backgroundColor: '#eee', margin: '20px 0' },
    subTitle: { fontSize: '15px', color: '#333', margin: '0 0 10px 0', fontWeight: 'bold' },
    desc: { fontSize: '14px', color: '#666', lineHeight: '1.6', margin: '0 0 25px 0' },
    stock: { fontSize: '14px', color: '#444', margin: '0 0 30px 0' },
    buyBtn: { width: '100%', padding: '15px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,77,79,0.25)' }
};
