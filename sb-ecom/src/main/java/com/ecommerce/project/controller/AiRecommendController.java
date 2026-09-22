package com.ecommerce.project.controller;

import com.ecommerce.project.service.AiRecommendService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/ai")
public class AiRecommendController {
    private final AiRecommendService aiRecommendService;

    public AiRecommendController(AiRecommendService aiRecommendService) {
        this.aiRecommendService = aiRecommendService;
    }

    // 1. 刷新商品向量库接口
    @PostMapping("/sync")
    public String syncProducts() {
        aiRecommendService.syncProductsToVectorDb();
        return "商品向量化同步成功，AI 已读完商品说明书！";
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> chatRecommendStream(@RequestParam("message") String message) {
        return aiRecommendService.recommendProductsStream(message);
    }
}
