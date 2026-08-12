const data = [{ name: "test" }];
try {
  JSON.parse(data);
} catch (e) {
  console.log("Error:", e.message);
}
