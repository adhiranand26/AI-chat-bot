// Contact Page Test Script
// This script can be run in the browser console to test functionality

console.log('🧪 Testing Contact Page Functionality');
console.log('=====================================');

// Test 1: Check if all required elements exist
const tests = [
    { name: 'Theme Toggle Button', selector: '#themeToggle' },
    { name: 'Contact Form', selector: '#contactForm' },
    { name: 'Submit Button', selector: '#submitBtn' },
    { name: 'Success Message', selector: '#successMessage' },
    { name: 'Character Counter', selector: '#charCount' },
    { name: 'FAQ Section', selector: '.faq-section' },
    { name: 'First Name Input', selector: '#firstName' },
    { name: 'Email Input', selector: '#email' },
    { name: 'Message Textarea', selector: '#message' }
];

let passedTests = 0;
tests.forEach(test => {
    const element = document.querySelector(test.selector);
    const passed = element !== null;
    console.log(`${passed ? '✅' : '❌'} ${test.name}: ${passed ? 'Found' : 'Missing'}`);
    if (passed) passedTests++;
});

console.log(`\n📊 Test Results: ${passedTests}/${tests.length} passed`);

// Test 2: Theme Toggle Functionality
console.log('\n🎨 Testing Theme Toggle...');
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const initialTheme = document.documentElement.getAttribute('data-theme');
    console.log(`Initial theme: ${initialTheme}`);
    
    // Simulate click
    themeToggle.click();
    const newTheme = document.documentElement.getAttribute('data-theme');
    console.log(`Theme after toggle: ${newTheme}`);
    
    const themeChanged = initialTheme !== newTheme;
    console.log(`${themeChanged ? '✅' : '❌'} Theme toggle functionality: ${themeChanged ? 'Working' : 'Not working'}`);
    
    // Toggle back
    themeToggle.click();
} else {
    console.log('❌ Theme toggle button not found');
}

// Test 3: Form Validation
console.log('\n📝 Testing Form Validation...');
const form = document.getElementById('contactForm');
if (form && typeof validateForm === 'function') {
    // Clear all inputs first
    document.getElementById('firstName').value = '';
    document.getElementById('email').value = '';
    document.getElementById('message').value = '';
    
    const emptyValidation = validateForm();
    console.log(`${!emptyValidation ? '✅' : '❌'} Empty form validation: ${!emptyValidation ? 'Correctly rejects empty form' : 'Failed to reject empty form'}`);
    
    // Test with valid data
    document.getElementById('firstName').value = 'Test';
    document.getElementById('email').value = 'test@example.com';
    document.getElementById('message').value = 'This is a test message with more than 10 characters';
    
    const validValidation = validateForm();
    console.log(`${validValidation ? '✅' : '❌'} Valid form validation: ${validValidation ? 'Correctly accepts valid form' : 'Failed to accept valid form'}`);
    
    // Clear form again
    form.reset();
} else {
    console.log('❌ Form or validation function not found');
}

// Test 4: FAQ Accordion
console.log('\n❓ Testing FAQ Accordion...');
const faqQuestions = document.querySelectorAll('.faq-question');
if (faqQuestions.length > 0) {
    console.log(`✅ Found ${faqQuestions.length} FAQ items`);
    
    // Test clicking first FAQ
    const firstFaq = faqQuestions[0];
    const faqItem = firstFaq.parentElement;
    const initialState = faqItem.classList.contains('active');
    
    firstFaq.click();
    const newState = faqItem.classList.contains('active');
    const toggled = initialState !== newState;
    
    console.log(`${toggled ? '✅' : '❌'} FAQ accordion toggle: ${toggled ? 'Working' : 'Not working'}`);
} else {
    console.log('❌ No FAQ items found');
}

console.log('\n🎉 Contact page testing complete!');
