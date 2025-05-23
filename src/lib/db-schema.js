// db-schema.js
import { createClient } from './server';

// This function sets up the database schema for your application
export async function setupDatabaseSchema() {
  try {
    const supabase = await createClient();
    
    // Create roles table if it doesn't exist
    const { error: rolesError } = await supabase.rpc('create_roles_table_if_not_exists');
    
    if (rolesError) {
      console.error('Error creating roles table:', rolesError);
    }
    
    // Insert default roles if they don't exist
    const { error: insertRolesError } = await supabase
      .from('roles')
      .upsert([
        { name: 'customer', description: 'Regular user who can browse and try on jewelry' },
        { name: 'vendor', description: 'Jewelry store owner who can manage products' },
        { name: 'admin', description: 'Administrator of the platform' }
      ], { onConflict: 'name' });
    
    if (insertRolesError) {
      console.error('Error inserting roles:', insertRolesError);
    }
    
    // Create user_roles table if it doesn't exist
    const { error: userRolesError } = await supabase.rpc('create_user_roles_table_if_not_exists');
    
    if (userRolesError) {
      console.error('Error creating user_roles table:', userRolesError);
    }
    
    // Create products table if it doesn't exist
    const { error: productsError } = await supabase.rpc('create_products_table_if_not_exists');
    
    if (productsError) {
      console.error('Error creating products table:', productsError);
    }
    
    // Create product_images table if it doesn't exist
    const { error: productImagesError } = await supabase.rpc('create_product_images_table_if_not_exists');
    
    if (productImagesError) {
      console.error('Error creating product_images table:', productImagesError);
    }
    
    // Create inquiries table if it doesn't exist
    const { error: inquiriesError } = await supabase.rpc('create_inquiries_table_if_not_exists');
    
    if (inquiriesError) {
      console.error('Error creating inquiries table:', inquiriesError);
    }
    
    // Create favorites table if it doesn't exist
    const { error: favoritesError } = await supabase.rpc('create_favorites_table_if_not_exists');
    
    if (favoritesError) {
      console.error('Error creating favorites table:', favoritesError);
    }
    
    console.log('Database schema setup completed successfully');
    return true;
  } catch (error) {
    console.error('Error setting up database schema:', error);
    return false;
  }
}