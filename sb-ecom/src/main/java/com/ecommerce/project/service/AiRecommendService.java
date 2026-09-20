package com.ecommerce.project.service;

import com.ecommerce.project.model.Product;
import com.ecommerce.project.repositories.ProductRepository;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiRecommendService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private VectorStore vectorStore; // 自动注入内存向量库

    @Autowired
    private ChatModel chatModel;


    /**
     * 🚀 动作 A：刷数据进向量库
     * 把 MySQL 里的商品描述变成“向量坐标说明书”塞进内存
     */
    public void syncProductsToVectorDb() {
        List<Product> products = productRepository.findAll();

        List<Document> documents = products.stream().map(p -> {
            // 对齐你的真实字段：productName, description, price
            String content = String.format("商品名称: %s, 商品描述: %s, 价格: %s元",
                    p.getProductName(), p.getDescription(), p.getPrice());

            // 对齐你的主键：productId
            return new Document(content, Map.of("productId", p.getProductId()));
        }).collect(Collectors.toList());

        // 存入内存向量库
        vectorStore.add(documents);
    }

    /**
     * 🚀 动作 B：听懂人话，RAG 精准推荐
     */
    public String recommendProducts(String userMessage) {
        // 1. 去向量数据库里，搜索跟用户提问语义最相似的 3 个商品坐标
        List<Document> similarDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(userMessage) // 填入用户的提问
                        .topK(3)            // 捞前 3 款相似鞋子
                        .build()            // 华丽闭合
        );

        if (similarDocs.isEmpty()) {
            return "抱歉客户，我们店里暂时没有找到相关的商品。";
        }

        // 2. 提取出这 3 个商品的真实 ID
        List<Long> matchedIds = similarDocs.stream()
                .map(doc -> Long.parseLong(doc.getMetadata().get("productId").toString()))
                .collect(Collectors.toList());

        // 3. 拿着 ID 去 MySQL 里查出最新、最真实的库存和价格（对齐你的 quantity 字段）
        List<Product> realProducts = productRepository.findByProductIdIn(matchedIds);

        // 4. 将真实的商品数据拼成 AI 答题的“小抄上下文”
        String storeContext = realProducts.stream()
                .map(p -> String.format("【商品ID: %d】名称: %s, 描述: %s, 价格: %s元, 当前库存: %d",
                        p.getProductId(), p.getProductName(), p.getDescription(), p.getPrice(), p.getQuantity()))
                .collect(Collectors.joining("\n---\n"));

        String systemInstruction = "你是一家全栈电商商城的金牌智能导购。请严格根据系统给出的【商城真实商品数据】回答用户。推荐时必须给出吸引人的理由，严禁凭空胡编商品！";
        String userInstruction = String.format("【商城真实商品数据】:\n%s\n\n【用户提问】:\n%s", storeContext, userMessage);

        // 组装系统消息和用户消息发送给通义千问
        Prompt prompt = new Prompt(List.of(
                new SystemMessage(systemInstruction),
                new UserMessage(userInstruction)
        ));

        // 呼叫大模型大脑并提取纯文本内容返回
        return chatModel.call(prompt).getResult().getOutput().getText();
    }


    public Flux<String> recommendProductsStream(String userMessage) {
        List<Document> similarDocs = vectorStore.similaritySearch(
                SearchRequest.builder().query(userMessage).topK(3).build()
        );
        if (similarDocs.isEmpty()) {
            return Flux.just("抱歉客户，我们店里暂时没有找到相关的商品。");
        }
        List<Long> matchedIds = similarDocs.stream()
                .map(doc -> Long.parseLong(doc.getMetadata().get("productId").toString()))
                .collect(Collectors.toList());
        List<Product> realProducts = productRepository.findByProductIdIn(matchedIds);
        String storeContext = realProducts.stream()
                .map(p -> String.format("【商品ID: %d】名称: %s, 描述: %s, 价格: %s元, 当前库存: %d",
                        p.getProductId(), p.getProductName(), p.getDescription(), p.getPrice(), p.getQuantity()))
                .collect(Collectors.joining("\n---\n"));

        String systemInstruction = "你是一家全栈电商商城的金牌智能导购。请严格根据系统给出的【商城真实商品数据】回答用户。推荐时必须给出吸引人的理由，严禁凭空胡编商品！";
        String userInstruction = String.format("【商城真实商品数据】:\n%s\n\n【用户提问】:\n%s", storeContext, userMessage);

        org.springframework.ai.chat.prompt.Prompt prompt = new org.springframework.ai.chat.prompt.Prompt(List.of(
                new SystemMessage(systemInstruction),
                new UserMessage(userInstruction)
        ));

        // 通义千问每算出一个字，后端就立刻通过网络源源不断地往外吐一个字！
        return chatModel.stream(prompt)
                .map(response -> response.getResult().getOutput().getText());
    }
}
