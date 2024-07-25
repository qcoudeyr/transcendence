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
print(driver.title)
driver.save_screenshot('django_login_page.png')

# Test Grafana login page
driver.get("http://10.0.10.31:3000/")
print(driver.title)
driver.save_screenshot('grafana_login_page.png')

# Test Kibana page
driver.get("http://10.0.10.22:5601/")
print(driver.title)
driver.save_screenshot('kibana_page.png')

# Test Nginx SPA page
driver.get("http://10.0.10.2/")
print(driver.title)
driver.save_screenshot('nginx_spa_page.png')

# Test Portainer page
driver.get("http://10.0.10.40:9000/#!/auth")
print(driver.title)
driver.save_screenshot('portainer_page.png')

# Test Prometheus page
driver.get("http://10.0.10.30:9090/")
print(driver.title)
driver.save_screenshot('prometheus_page.png')

# Quit the driver
try:
    driver.quit()
except PermissionError:
    os.kill(service.process.pid, signal.SIGTERM)
