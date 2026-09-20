package com.ecommerce.project.controller;

import com.ecommerce.project.service.AiRecommendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
public class AiRecommendController {

    @Autowired
    private AiRecommendService aiRecommendService;

    // 1. 刷新商品向量库接口
    @PostMapping("/sync")
    public String syncProducts() {
        aiRecommendService.syncProductsToVectorDb();
        return "商品向量化同步成功，AI 已读完商品说明书！";
    }

    // 2. 智能导购聊天接口
    // 测试例子：/api/ai/chat?message=我想找个500元以内防水适合跑步的鞋子
    @GetMapping("/chat")
    public String chatRecommend(@RequestParam("message") String message) {
        return aiRecommendService.recommendProducts(message);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatRecommendStream(@RequestParam("message") String message) {
        return aiRecommendService.recommendProductsStream(message);
    }
}
