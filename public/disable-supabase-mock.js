// This script disables the Supabase mock implementation
// Add this to your HTML with a script tag to disable the mock:
// <script src="/disable-supabase-mock.js"></script>

(function() {
  localStorage.removeItem('USE_SUPABASE_MOCK');
  console.log('Supabase mock implementation disabled. Refresh the page to apply.');
})();
