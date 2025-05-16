// This script enables the Supabase mock implementation
// Add this to your HTML with a script tag to enable the mock:
// <script src="/enable-supabase-mock.js"></script>

(function() {
  localStorage.setItem('USE_SUPABASE_MOCK', 'true');
  console.log('Supabase mock implementation enabled. Refresh the page to apply.');
})();
