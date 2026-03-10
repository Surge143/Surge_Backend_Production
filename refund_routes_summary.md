# Refund Routes Analysis

This document provides the route details and expected parameters for initiating refunds across the three main systems: **Web Orders**, **App Orders**, and **Web Subscriptions**.

## Overview

All three refund routes are implemented as `GET` requests within their respective Payload collection endpoints. They do not require a JSON body; instead, they use the order or subscription ID in the URL and an optional `reason` as a query parameter.

---

## 1. Web Orders Refund
- **Route**: `GET /api/web-orders/:id/cancel`
- **Method**: `GET`
- **Query Parameters**:
  - `reason` (string, optional): The reason for the refund.
- **Example URL**: `/api/web-orders/123/cancel?reason=Customer requested cancellation`
- **Logic**: 
  - Initiates a Stripe refund for the associated `payment_intent`.
  - Updates the order status to `refund-initiated`.
  - Final status update to `refunded` is handled by the Stripe webhook.

---

## 2. App Orders Refund
- **Route**: `GET /api/app-orders/:id/cancel`
- **Method**: `GET`
- **Query Parameters**:
  - `reason` (string, optional): The reason for the refund.
- **Example URL**: `/api/app-orders/456/cancel?reason=Inventory issue`
- **Logic**: 
  - Only allowed if the order status is `pending` and payment status is `paid`.
  - Initiates a Stripe refund for the associated `payment_intent`.
  - Updates the order status to `refund-initiated`.

---

## 3. Web Subscription Refund
- **Route**: `GET /api/web-subscription/:id/cancel`
- **Method**: `GET`
- **Query Parameters**:
  - `reason` (string, optional): The reason for cancellation.
- **Example URL**: `/api/web-subscription/789/cancel?reason=Service no longer needed`
- **Logic**: 
  - Cancels the Stripe subscription immediately (not at the end of the period).
  - If a `paymentIntentId` is found, it also initiates a refund for the most recent payment.
  - Updates the subscription status to `cancelled`.

---

## Summary of "Three Things"

| Entity | Route Slug | Trigger Event | Status Change |
| :--- | :--- | :--- | :--- |
| **Store Orders** | `web-orders` | Manually triggered cancellation | `refund-initiated` |
| **App Orders** | `app-orders` | Manually triggered cancellation | `refund-initiated` |
| **Subscriptions** | `web-subscription` | Manually triggered cancellation | `cancelled` |
