# Security Specification for Inventory Management App

## Data Invariants
1. Orders must belong to valid factories and products.
2. Deliveries must reference valid orders.
3. Quantity received in a delivery cannot exceed (totalQty - receivedQty) of the order in a strict system, but in reality, sometimes over-deliveries happen. For this app, we'll enforce that `quantityReceived` must be positive.
4. Distributions must belong to valid stores and products.
5. `stockQty` of a product should ideally only be updated via system processes (like delivery receipt or distribution), but client-side updates are needed for now unless we use Functions. Since we don't have Functions, we'll allow client-side updates with strict validation.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a supplier with a fake `ownerId` (if we had one).
2. **Resource Poisoning**: Create a product with a 1MB string in `sku`.
3. **Negative Stock**: Distribution with negative quantity.
4. **Orphaned Delivery**: Delivery for a non-existent order.
5. **Unauthorized Store Edit**: User A edits User B's store (if multi-user).
6. **Immutable Field Change**: Changing `sku` after product creation.
7. **Type Mismatch**: Sending `price` as a string.
8. **Negative Rating**: Supplier with rating -10.
9. **Zero Quantity Order**: Factory order with 0 `totalQty`.
10. **Schema Injection**: Adding `isVerified: true` to a supplier without it being in the schema.
11. **Spoofed Auth**: Accessing private data with unverified email.
12. **Batch Inconsistency**: Delivery created without updating the order's `receivedQty`.

## Test Plan
- Verify that only authenticated users can read/write.
- Verify field types and sizes.
- Verify relational existence for orders, deliveries, and distributions.
