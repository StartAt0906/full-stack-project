package com.ecommerce.project.exceptions;

public class ResourceNotFoundException extends RuntimeException {
    private String resourceName;
    private String filed;
    private String filedName;
    private Long filedId;

    public ResourceNotFoundException(String resourceName, String filed, String filedName) {
        super(String.format("%s not found with %s: %s", resourceName, filed, filedName));
        this.resourceName = resourceName;
        this.filed = filed;
        this.filedName = filedName;
    }

    public ResourceNotFoundException(String resourceName, String filed, Long filedId) {
        super(String.format("%s not found with %s: %d", resourceName, filed, filedId));
        this.resourceName = resourceName;
        this.filed = filed;
        this.filedId = filedId;
    }
}
