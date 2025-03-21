// Initialize Supabase client
const supabaseUrl = 'https://iijzdoimduaulxtyfmwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpanpkb2ltZHVhdWx4dHlmbXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0OTc5NTEsImV4cCI6MjA1ODA3Mzk1MX0.DQtCE2CZCIVw0wVCaaJs7G3XufVsASyZYaefgHv7pX0';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Helper functions for Supabase authentication and data operations

async function checkUser() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Error checking user:', error);
        return null;
    }
}

async function getSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

async function signUp(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

// Record login
async function recordLogin(userId) {
  const { error } = await supabase
    .from('user_logins')
    .insert([{ user_id: userId, login_time: new Date() }]);
  
  if (error) console.error('Error recording login:', error);
}

// Get user profile
async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Save user data
async function saveUserData(userId, dataType, data) {
  // Check if data exists for this user and type
  const { data: existingData, error: fetchError } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .eq('data_type', dataType)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows returned
    console.error('Error fetching existing data:', fetchError);
    return false;
  }
  
  // Convert data to JSON string
  const jsonData = JSON.stringify(data);
  
  let result;
  if (existingData) {
    // Update existing data
    result = await supabase
      .from('user_data')
      .update({ data: jsonData, updated_at: new Date() })
      .eq('id', existingData.id);
  } else {
    // Insert new data
    result = await supabase
      .from('user_data')
      .insert([{ 
        user_id: userId, 
        data_type: dataType, 
        data: jsonData,
        created_at: new Date(),
        updated_at: new Date()
      }]);
  }
  
  if (result.error) {
    console.error('Error saving data:', result.error);
    return false;
  }
  
  return true;
}

// Load user data
async function loadUserData(userId, dataType) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .eq('data_type', dataType)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') { // No data found
      return null;
    }
    console.error('Error loading data:', error);
    return null;
  }
  
  try {
    return JSON.parse(data.data);
  } catch (e) {
    console.error('Error parsing data:', e);
    return null;
  }
}

// Create necessary tables if they don't exist
async function createTablesIfNeeded() {
  // This would typically be done in a migration script or server-side
  // For demo purposes, we'll check and create tables if needed
  
  // Check if user_data table exists
  const { error: checkError } = await supabase
    .from('user_data')
    .select('id')
    .limit(1);
  
  if (checkError && checkError.code === '42P01') { // Table doesn't exist
    console.log('Creating user_data table...');
    // This won't work with client-side permissions, would need to be done server-side
    // Just showing the structure for demonstration
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_data (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, data_type)
      );
    `;
    // This would be executed server-side
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Check and create subjects table
    const { error: subjectsError } = await supabase
      .from('subjects')
      .select('id')
      .limit(1);
    
    if (subjectsError && subjectsError.code === '42P01') {
      console.log('Creating subjects table...');
      // This would typically be done in a migration or server-side
      // Using RLS policies instead for client-side
    }
    
    // Check and create attendance table
    const { error: attendanceError } = await supabase
      .from('attendance')
      .select('id')
      .limit(1);
    
    if (attendanceError && attendanceError.code === '42P01') {
      console.log('Creating attendance table...');
      // This would typically be done in a migration or server-side
    }
    
    console.log('Database initialized');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

// Function to check database connection
async function checkDatabaseConnection() {
    try {
        const { data, error } = await supabase.from('subjects').select('count').limit(1);
        
        if (error) {
            if (error.code === '42P01') {
                console.error('Table does not exist:', error);
                return { connected: false, message: 'Database tables not configured properly' };
            } else if (error.code === 'PGRST301') {
                console.error('Authentication required:', error);
                return { connected: false, message: 'Authentication required' };
            } else {
                console.error('Database error:', error);
                return { connected: false, message: 'Unable to connect to database' };
            }
        }
        
        return { connected: true, message: 'Connected to database' };
    } catch (error) {
        console.error('Error checking database connection:', error);
        return { connected: false, message: 'Unable to connect to database' };
    }
}

// Function to handle database errors
function handleDatabaseError(error, operation = '') {
    if (!error) return null;

    console.error(`Database error during ${operation}:`, error);

    // Handle specific PostgreSQL error codes
    switch (error.code) {
        case '42P01':
            return {
                message: 'Database tables not configured properly. Please contact support.',
                type: 'error',
                technical: error.message
            };
        case '23505':
            return {
                message: 'This record already exists.',
                type: 'error',
                technical: error.message
            };
        case '23503':
            return {
                message: 'This operation cannot be completed because the record is referenced by other data.',
                type: 'error',
                technical: error.message
            };
        case 'PGRST301':
            return {
                message: 'Your session has expired. Please log in again.',
                type: 'error',
                technical: error.message,
                action: 'logout'
            };
        case '42501':
            return {
                message: 'You do not have permission to perform this action.',
                type: 'error',
                technical: error.message
            };
        case '23502':
            return {
                message: 'Please fill in all required fields.',
                type: 'error',
                technical: error.message
            };
        default:
            // Handle Supabase-specific error messages
            if (error.message?.includes('JWT')) {
                return {
                    message: 'Your session has expired. Please log in again.',
                    type: 'error',
                    technical: error.message,
                    action: 'logout'
                };
            }
            
            return {
                message: 'An unexpected error occurred. Please try again.',
                type: 'error',
                technical: error.message
            };
    }
}

// Function to execute database operations with retry
async function executeWithRetry(operation, maxRetries = 3) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            const result = await operation();
            return { success: true, data: result };
        } catch (error) {
            attempts++;
            
            const errorInfo = handleDatabaseError(error);
            
            if (errorInfo?.action === 'logout' || attempts === maxRetries) {
                return { success: false, error: errorInfo };
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
    }
}