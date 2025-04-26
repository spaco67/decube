import clientPromise from './mongodb';
import { MenuItem, Order, OrderItem } from '../types';
import { menuItems } from '../data/menuItems';

export async function initializeMenuItems() {
  try {
    const client = await clientPromise;
    const db = client.db('decubedb');
    const menuItemsCollection = db.collection('menuItems');

    // Insert menu items if they don't exist
    for (const item of menuItems) {
      await menuItemsCollection.updateOne(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true }
      );
    }

    console.log('Menu items initialized successfully');
  } catch (error) {
    console.error('Failed to initialize menu items:', error);
    throw error;
  }
}

export async function createOrder(order: Omit<Order, 'id'>) {
  try {
    const client = await clientPromise;
    const db = client.db('decubedb');
    const orders = db.collection('orders');

    const result = await orders.insertOne(order);
    return { ...order, id: result.insertedId };
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: string, itemIds?: number[]) {
  try {
    const client = await clientPromise;
    const db = client.db('decubedb');
    const orders = db.collection('orders');

    if (itemIds && itemIds.length > 0) {
      await orders.updateOne(
        { _id: orderId },
        { 
          $set: {
            'items.$[elem].status': status,
            updatedAt: new Date()
          }
        },
        {
          arrayFilters: [{ 'elem.id': { $in: itemIds } }]
        }
      );
    } else {
      await orders.updateOne(
        { _id: orderId },
        { 
          $set: {
            status,
            'items.$[].status': status,
            updatedAt: new Date()
          }
        }
      );
    }
  } catch (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
}

export async function getOrders() {
  try {
    const client = await clientPromise;
    const db = client.db('decubedb');
    const orders = db.collection('orders');

    return await orders.find().toArray();
  } catch (error) {
    console.error('Failed to get orders:', error);
    throw error;
  }
}