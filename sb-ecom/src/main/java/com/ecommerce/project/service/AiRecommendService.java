package com.ecommerce.project.service;

import com.ecommerce.project.model.Product;
import com.ecommerce.project.repositories.ProductRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiRecommendService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ProductRepository productRepository;

    //利用 Builder 链式配置好“金牌导购”系统人设
    public AiRecommendService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore, ProductRepository productRepository) {
        this.vectorStore = vectorStore;
        this.productRepository = productRepository;
        this.chatClient = chatClientBuilder
                .defaultSystem("你是一家全栈电商商城的金牌智能导购。请严格根据系统给出的【商城真实商品数据】回答用户。"
                        + "【⚠️铁律】：你在推荐任何商品时，必须在商品名称前面，严格打印出该商品的 ID，格式必须写成：【商品ID: 数字】（例如：【商品ID: 17】）。"
                        + "如果漏掉这个格式，系统将会崩溃！推荐时必须给出吸引人的理由，严禁凭空胡编商品！")
                .build();
    }


    public Flux<String> recommendProductsStream(String userMessage) {
        // 捞前 3 款相似鞋子
        List<Document> similarDocs = vectorStore.similaritySearch(
                SearchRequest.builder().query(userMessage).topK(3).build()
        );

        if (similarDocs.isEmpty()) {
            return Flux.just("抱歉客户，我们店里暂时没有找到相关的商品。");
        }

        // 提取商品真实 ID 并回表 MySQL
        List<Long> matchedIds = similarDocs.stream()
                .map(doc -> Long.parseLong(doc.getMetadata().get("productId").toString()))
                .collect(Collectors.toList());
        List<Product> realProducts = productRepository.findByProductIdIn(matchedIds);

        // 将真实的商品数据拼成大模型的“小抄上下文”
        String storeContext = realProducts.stream()
                .map(p -> String.format("【商品ID: %d】名称: %s, 描述: %s, 价格: %s元, 当前库存: %d",
                        p.getProductId(), p.getProductName(), p.getDescription(), p.getPrice(), p.getQuantity()))
                .collect(Collectors.joining("\n---\n"));

        // 使用 ChatClient 完美支持流式打字机输出
        return this.chatClient.prompt()
                .user(u -> u.text("【商城真实商品数据】:\n{context}\n\n【用户提问】:\n{query}")
                        .param("context", storeContext)
                        .param("query", userMessage))
                .stream()  // 核心：转换为响应式流
                .content(); // 自动流式提取文本内容
    }

    /**
     * 4. 商品数据批量同步至向量库
     */
    public void syncProductsToVectorDb() {
        List<Product> products = productRepository.findAll();

        List<Document> documents = products.stream().map(p -> {
            String content = String.format("商品名称: %s, 商品描述: %s, 价格: %s元",
                    p.getProductName(), p.getDescription(), p.getPrice());

            return new Document(content, Map.of("productId", p.getProductId()));
        }).collect(Collectors.toList());

        // 存入向量库
        vectorStore.add(documents);
    }
}
