import { Resend } from 'resend';
import { supabase } from './supabase';

const resend = new Resend('re_XznLaT3f_2CCcRR1qFVki8WYxLTa6W9WD');

async function getAdminEmail() {
  try {
    // First try to get existing settings
    let { data, error } = await supabase
      .from('settings')
      .select('admin_email')
      .limit(1)
      .maybeSingle();
    
    // If no settings exist, create default settings
    if (!data) {
      const defaultSettings = {
        admin_email: 'admin@decube.com',
        notifications: {
          logins: true,
          inventory: true,
          transactions: true
        },
        business_info: {
          name: 'DECUBE Bar & Restaurant',
          email: 'contact@decube.com',
          phone: '+1 (555) 123-4567',
          address: '123 Restaurant Street'
        }
      };

      const { data: newData, error: insertError } = await supabase
        .from('settings')
        .insert([defaultSettings])
        .select('admin_email')
        .single();

      if (insertError) {
        console.error('Failed to create default settings:', insertError);
        return 'admin@decube.com'; // Fallback
      }

      return newData.admin_email;
    }
    
    if (error) {
      console.error('Failed to get admin email:', error);
      return 'admin@decube.com'; // Fallback
    }
    
    return data.admin_email;
  } catch (error) {
    console.error('Failed to get admin email:', error);
    return 'admin@decube.com'; // Fallback
  }
}

export async function sendLoginNotification(userEmail: string, userName: string, role: string) {
  try {
    const adminEmail = await getAdminEmail();
    
    await resend.emails.send({
      from: 'DECUBE <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'New Staff Login',
      html: `
        <h2>New Staff Login Alert</h2>
        <p>A staff member has just logged in:</p>
        <ul>
          <li><strong>Name:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>Role:</strong> ${role}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
      `
    });
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
}

export async function sendTransactionNotification(
  staffName: string,
  staffRole: string,
  orderId: string,
  totalAmount: number,
  items: string[],
  paymentMethod: string
) {
  try {
    const adminEmail = await getAdminEmail();
    
    await resend.emails.send({
      from: 'DECUBE <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'New Transaction Completed',
      html: `
        <h2>New Transaction Alert</h2>
        <p>A transaction has been completed:</p>
        <ul>
          <li><strong>Staff Name:</strong> ${staffName}</li>
          <li><strong>Role:</strong> ${staffRole}</li>
          <li><strong>Order ID:</strong> ${orderId}</li>
          <li><strong>Payment Method:</strong> ${paymentMethod.toUpperCase()}</li>
          <li><strong>Total Amount:</strong> ₦${totalAmount.toFixed(2)}</li>
          <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <h3>Items:</h3>
        <ul>
          ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      `
    });
  } catch (error) {
    console.error('Failed to send transaction notification:', error);
  }
}