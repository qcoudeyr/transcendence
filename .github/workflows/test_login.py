from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# Configure Chrome options
chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

# Spécifiez le chemin vers le binaire de ChromeDriver
chrome_driver_path = "/snap/bin/chromium.chromedriver"
service = Service(executable_path=chrome_driver_path)

# Initialize the WebDriver
driver = webdriver.Chrome(service=service, options=chrome_options)

# Test Django login page
driver.get("http://10.0.10.10:8000/")
assert "Django" in driver.title

# Test Grafana login page
driver.get("http://10.0.10.31:3000/")
assert "Grafana" in driver.title

# Test Kibana page
driver.get("http://10.0.10.22:5601/")
assert "Kibana" in driver.title

# Test Nginx SPA page
driver.get("http://10.0.10.2/")
assert "Nginx" in driver.title

# Test Portainer page
driver.get("http://10.0.10.40:9000/#!/auth")
assert "Portainer" in driver.title

# Test Prometheus page
driver.get("http://10.0.10.30:9090/")
assert "Prometheus" in driver.title

driver.quit()
