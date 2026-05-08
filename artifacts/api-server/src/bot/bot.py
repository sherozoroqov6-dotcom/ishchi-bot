"""
Mehnat.uz - Daromad oshirish avtomatik bot  v10
Hal qilingan muammolar:
  - Sayt Vuetify 2 ishlatadi: .v-menu__content .v-list-item__title
  - v-overlay--active keyingi dropdownni bloklaydi → overlay yopilguncha kutish
  - Hudud va Tuman pre-filled (profil asosida) → click kerak emas
  - Tashkilot STIR va barcha inputlar label→input mapping bilan ishlayapti
  - v10: Yonalish dropdown label orqali topish, scroll + JS click qo'shildi
"""

import sys
import time
import json
import openpyxl
from datetime import date, datetime
from openpyxl.styles import PatternFill
from openpyxl.utils.datetime import from_excel
from pathlib import Path
from playwright.sync_api import sync_playwright

try:
    import pyautogui
    pyautogui.FAILSAFE = False
    HAS_PYG = True
except ImportError:
    HAS_PYG = False

# ============================================================
LOGIN_URL   = "https://yangiish.mehnat.uz/auth/login"
CREATE_URL  = "https://yangiish.mehnat.uz/income/create-employees"
# ============================================================

def log(level, message, row_number=None):
    entry = {"level": level, "message": message, "rowNumber": row_number, "timestamp": datetime.now().isoformat()}
    print(json.dumps(entry), flush=True)

def w(sec=1.0):
    time.sleep(sec)

def read_excel(filepath):
    wb = openpyxl.load_workbook(filepath)
    ws = wb.active
    headers, rows = [], []
    for i, row in enumerate(ws.iter_rows(values_only=True), start=1):
        if i == 1:
            headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(row)]
        elif any(cell for cell in row):
            rows.append((i, dict(zip(headers, row))))
    wb.close()
    log("info", f"Excel: {len(rows)} ta qator o'qildi.")
    return rows

def mark_excel_row_yellow(filepath, row_number):
    try:
        wb = openpyxl.load_workbook(filepath)
        ws = wb.active
        yellow_fill = PatternFill(start_color="FFFF00", end_color="FFFF00", fill_type="solid")
        for cell in ws[row_number]:
            cell.fill = yellow_fill
        wb.save(filepath)
        wb.close()
        log("info", f"Excel #{row_number} qator sariq rangga bo'yaldi", row_number)
        return True
    except Exception as e:
        log("warn", f"Excel #{row_number} qatorni bo'yashda xato: {e}", row_number)
        return False

def find_col(row, *names):
    for name in names:
        for key in row:
            if name.lower() in str(key).lower():
                v = row[key]
                if v is not None:
                    return str(v).strip()
    return ""

def to_ymd(val):
    if val is None:
        return ""
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d")
    if isinstance(val, date):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if not s:
        return ""
    if " " in s:
        first_part = s.split(" ", 1)[0].strip()
        if first_part:
            s = first_part
    for fmt in ("%d.%m.%Y", "%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    if len(s) == 8 and s.isdigit():
        try:
            return datetime.strptime(s, "%d%m%Y").strftime("%Y-%m-%d")
        except ValueError:
            pass
    try:
        if s.replace(".", "", 1).isdigit():
            serial = float(s)
            if 20000 <= serial <= 60000:
                return from_excel(serial).strftime("%Y-%m-%d")
    except:
        pass
    return s

def wait_overlay_close(page, timeout=5000):
    try:
        page.wait_for_selector(
            ".v-overlay--active, .v-overlay__scrim",
            state="hidden",
            timeout=timeout
        )
        w(0.4)
    except:
        w(0.6)

def close_any_open_menu(page):
    try:
        if page.locator(".v-menu__content:visible, .v-overlay__content:visible").count() > 0:
            page.keyboard.press("Escape")
            wait_overlay_close(page, timeout=2000)
    except:
        pass

def set_year_2026(page):
    try:
        year_selectors = [
            "button:has-text('2025')",
            ".v-btn:has-text('2025')",
            "span:has-text('2025-йил')",
        ]
        for sel in year_selectors:
            try:
                btn = page.locator(sel).first
                if btn.is_visible(timeout=1000):
                    btn.click()
                    w(0.5)
                    next_btn = page.locator("button:has-text('2026'), .v-btn:has-text('2026')").first
                    if next_btn.is_visible(timeout=1000):
                        next_btn.click()
                        w(0.5)
                    break
            except:
                pass
    except:
        pass

def select_dropdown_by_label(page, label_text, option_text, timeout=8000):
    try:
        label_loc = page.locator(f"label:has-text('{label_text}')").first
        label_loc.scroll_into_view_if_needed()
        w(0.3)
        parent = page.locator(f"label:has-text('{label_text}')").locator("xpath=ancestor::div[contains(@class,'v-input')]").first
        parent.click()
        w(0.5)
        option = page.locator(f".v-menu__content .v-list-item__title:has-text('{option_text}'), .v-menu__content .v-list-item__content:has-text('{option_text}')").first
        option.scroll_into_view_if_needed()
        option.click(timeout=timeout)
        wait_overlay_close(page)
        return True
    except Exception as e:
        log("warn", f"Dropdown '{label_text}' → '{option_text}' tanlashda xato: {e}")
        return False

def fill_input_by_label(page, label_text, value, clear=True):
    try:
        label_loc = page.locator(f"label:has-text('{label_text}')").first
        label_loc.scroll_into_view_if_needed()
        parent = page.locator(f"label:has-text('{label_text}')").locator("xpath=ancestor::div[contains(@class,'v-input')]").first
        inp = parent.locator("input, textarea").first
        inp.scroll_into_view_if_needed()
        inp.click()
        if clear:
            inp.triple_click()
            inp.press("Control+a")
            inp.press("Delete")
        inp.type(str(value), delay=50)
        w(0.3)
        return True
    except Exception as e:
        log("warn", f"Input '{label_text}' to'ldirishda xato: {e}")
        return False

def process_row(page, settings, row_data, row_num, excel_path):
    log("info", f"#{row_num} qator ishlanmoqda...", row_num)
    try:
        page.goto(CREATE_URL, wait_until="networkidle", timeout=30000)
        w(1.5)
        set_year_2026(page)

        defaults = {
            "hudud": settings.get("defaultHudud", "Самарқанд вилояти"),
            "tuman": settings.get("defaultTuman", "Ургут тумани"),
            "mahalla": settings.get("defaultMahalla", "Бахринси"),
            "yonalish": settings.get("defaultYonalish", "пиллачилик соҳасида аҳолини мавсумий банд қилиш"),
            "oy": settings.get("defaultOy", "Aпрел"),
            "shartnoma_turi": settings.get("defaultShartnomaUri", "Фуқаролик-ҳуқуқий шартнома"),
            "ish_boshlangan": settings.get("defaultIshBoshlangan", "2026-04-01"),
            "shartnoma_san": settings.get("defaultShartnamaSan", "2026-04-01"),
            "bajarilgan": settings.get("defaultBajarilgan", "Ёрдамчи"),
        }

        hudud = find_col(row_data, "Ҳудуд", "Hudud", "Регион") or defaults["hudud"]
        tuman = find_col(row_data, "Туман", "Tuman", "Район") or defaults["tuman"]
        mahalla = find_col(row_data, "Маҳалла", "Mahalla") or defaults["mahalla"]
        yonalish = find_col(row_data, "Йўналиш", "Yonalish") or defaults["yonalish"]
        oy = find_col(row_data, "Ой", "Oy", "Месяц") or defaults["oy"]
        shartnoma_turi = find_col(row_data, "Шартнома тури", "Shartnoma turi") or defaults["shartnoma_turi"]
        tashkilot_stir = find_col(row_data, "Ташкилот СТИР", "СТИР") or ""
        jshshir = find_col(row_data, "ЖШШИР") or ""
        tug_sana = to_ymd(find_col(row_data, "Туғулган", "Tug'ilgan")) or ""
        ish_boshlangan = to_ymd(find_col(row_data, "Иш бошланган", "Ish boshlangan")) or defaults["ish_boshlangan"]
        shartnoma_raqam = find_col(row_data, "Шартнома рақами", "Shartnoma raqami") or ""
        shartnoma_san = to_ymd(find_col(row_data, "Шартнома санаси", "Shartnoma sanasi")) or defaults["shartnoma_san"]
        bajarilgan = find_col(row_data, "Бажарилган", "Bajarilgan") or defaults["bajarilgan"]

        # Fill Mahalla
        select_dropdown_by_label(page, "Маҳаллани танланг", mahalla)
        # Fill Yonalish
        select_dropdown_by_label(page, "Йўналиш", yonalish)
        # Fill Oy
        select_dropdown_by_label(page, "Ой", oy)
        # Fill Shartnoma turi
        select_dropdown_by_label(page, "Шартнома тури", shartnoma_turi)

        if tashkilot_stir:
            fill_input_by_label(page, "Ташкилот СТИР", tashkilot_stir)
            w(1.0)

        # Employee search
        emp_search = settings.get("employeeSearch", "TEMURSULTON")
        if jshshir:
            fill_input_by_label(page, "ЖШШИР", jshshir)
            w(2.0)

        if tug_sana:
            fill_input_by_label(page, "Туғулган кун санаси", tug_sana)

        fill_input_by_label(page, "Иш бошланган сана", ish_boshlangan)

        if shartnoma_raqam:
            fill_input_by_label(page, "Шартнома рақами", shartnoma_raqam)

        fill_input_by_label(page, "Шартнома санаси", shartnoma_san)

        select_dropdown_by_label(page, "Бажарилган иш", bajarilgan)

        # Submit
        try:
            submit_btn = page.locator("button[type='submit'], button:has-text('Сақлаш'), button:has-text('Saqlash'), button:has-text('Yuborish')").first
            submit_btn.scroll_into_view_if_needed()
            submit_btn.click()
            w(2.0)
            log("success", f"#{row_num} qator muvaffaqiyatli saqlandi!", row_num)
            mark_excel_row_yellow(excel_path, row_num)
            return True
        except Exception as e:
            log("error", f"#{row_num} saqlashda xato: {e}", row_num)
            return False

    except Exception as e:
        log("error", f"#{row_num} qator xatosi: {e}", row_num)
        return False

def run_bot(excel_path, settings, stop_file=None):
    password = settings.get("password", "")
    employee_search = settings.get("employeeSearch", "TEMURSULTON")
    headless = settings.get("headless", True)

    rows = read_excel(excel_path)
    total = len(rows)
    log("info", f"Jami {total} ta qator topildi")

    processed = 0
    failed = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless, args=["--no-sandbox", "--disable-dev-shm-usage"])
        ctx = browser.new_context()
        page = ctx.new_page()

        # Login
        log("info", "Login qilinmoqda...")
        try:
            page.goto(LOGIN_URL, wait_until="networkidle", timeout=30000)
            w(1.5)

            # Find employee input and type
            emp_input = page.locator("input[placeholder*='TEMURSULTON'], input[type='text']").first
            emp_input.fill(employee_search)
            w(0.5)

            emp_option = page.locator(f".v-list-item:has-text('{employee_search}'), li:has-text('{employee_search}')").first
            if emp_option.is_visible(timeout=3000):
                emp_option.click()
                w(0.5)

            pwd_input = page.locator("input[type='password']").first
            pwd_input.fill(password)
            w(0.3)

            login_btn = page.locator("button[type='submit'], button:has-text('Kirish'), button:has-text('Войти')").first
            login_btn.click()
            page.wait_for_url("**/income/**", timeout=15000)
            log("success", "Login muvaffaqiyatli!")
        except Exception as e:
            log("error", f"Login xatosi: {e}")
            browser.close()
            return

        for row_num, row_data in rows:
            # Check stop signal
            if stop_file and Path(stop_file).exists():
                log("warn", "Bot to'xtatildi (stop signal)")
                break

            ok = process_row(page, settings, row_data, row_num, excel_path)
            if ok:
                processed += 1
            else:
                failed += 1

            log("info", f"Holat: {processed}/{total} muvaffaqiyatli, {failed} xato")

        browser.close()

    log("info", f"Bot yakunlandi. Jami: {total}, muvaffaqiyatli: {processed}, xato: {failed}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"level": "error", "message": "Usage: bot.py <excel_file> <settings_json>"}))
        sys.exit(1)

    excel_file = sys.argv[1]
    settings_json = sys.argv[2]
    stop_file = sys.argv[3] if len(sys.argv) > 3 else None

    try:
        settings = json.loads(settings_json)
    except:
        settings = {}

    run_bot(excel_file, settings, stop_file)
