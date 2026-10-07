async function testApi() {
    try {
        const res = await fetch('http://localhost:3000/api/eworks/customers?page=1&limit=5');
        const data = await res.json();
        console.log('API Response Status:', res.status);
        console.log('Pagination:', data.pagination);
        console.log('Real Metrics:', data.metrics);
        console.log('Filter Counts:', data.filterCounts);
        console.log('Sample Customer Name:', data.customers?.[0]?.full_name, 'ID:', data.customers?.[0]?.eworks_customer_id);
    } catch (e) {
        console.error('API Test Error:', e);
    }
}

testApi();
