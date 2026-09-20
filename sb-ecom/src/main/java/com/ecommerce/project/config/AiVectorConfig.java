package com.ecommerce.project.config;

import org.springframework.ai.embedding.EmbeddingModel; // 💡 使用阿里原生的通用接口
import org.springframework.ai.vectorstore.SimpleVectorStore;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiVectorConfig {

    /**
     * 💡 将内存向量数据库注入给 Spring 容器
     * 只要项目引入了 spring-ai-alibaba-starter，Spring 会自动把通义千问算坐标的机器（EmbeddingModel）传进来
     */
    @Bean
    public VectorStore vectorStore(EmbeddingModel embeddingModel) {
        System.out.println("====== [AI 配置] 正在使用通义千问引擎初始化本地内存向量数据库... ======");
        return SimpleVectorStore.builder(embeddingModel).build();
    }
}

