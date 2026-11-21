import os
# Optional browser regression check: start npm run dev and install Python Playwright.
# The API fixture is test-only; it does not exercise a production database.
origin=os.environ.get("JOJO_TEST_ORIGIN", "http://127.0.0.1:8095").rstrip("/")
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 fixture={'files':[{'path':'index.html','content':'<h1>Accueil test</h1><a href="/account/">Compte</a>','encoding':'utf8'},{'path':'account/index.html','content':'<h1>Compte test</h1><a href="/">Retour</a>','encoding':'utf8'}],'requiresBuild':False}
 page.route('**/api/projects/1/preview',lambda route:route.fulfill(json=fixture))
 page.goto(origin+'/p/1',wait_until='domcontentloaded',timeout=60000)
 frame=page.frame_locator('iframe[title="Aperçu isolé du projet"]')
 frame.get_by_role('link',name='Compte',exact=True).click(timeout=20000)
 frame.get_by_role('heading',name='Compte test',exact=True).wait_for()
 frame.get_by_role('link',name='Retour',exact=True).click()
 frame.get_by_role('heading',name='Accueil test',exact=True).wait_for()
 assert page.url==origin+'/p/1'
 assert page.locator('iframe').get_attribute('sandbox')=='allow-scripts'
 print('Browser preview fixture: home -> nested page -> home passed; isolated iframe preserved.')
 browser.close()
