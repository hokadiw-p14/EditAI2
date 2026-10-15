import { ProjectFile } from '../types';

export const SAMPLE_PROJECTS: Record<string, ProjectFile[]> = {
  'syntax_error_test': [
    {
      name: 'script_with_errors.rpy',
      path: 'game/script_with_errors.rpy',
      content: `# ตัวอย่างโค้ด Ren'Py ที่มีจุดผิดพลาดไวยากรณ์ (Syntax Errors)
# สำหรับทดสอบระบบตรวจจับไวยากรณ์แบบ Real-Time พร้อมคำอธิบายและ Quick Fix

define s = Character("ซากุระ", color="#ff77aa")
define mc = Character("[player_name]", color="#3399ff")

# 1. ข้อผิดพลาด: label ขาดเครื่องหมายโคลอน (:)
label start

    # 2. ข้อผิดพลาด: คำสั่งสะกดผิด (scence -> scene)
    scence bg classroom
    with fade

    # 3. ข้อผิดพลาด: บทสนทนาอัญประกาศคู่ไม่ปิด
    s "สวัสดีตอนเช้าจ้ะ! วันนี้มีเรียนวิชาเวทมนตร์ด้วยนะ

    # 4. ข้อผิดพลาด: แท็ก {color} เปิดไว้แต่ไม่มีแท็กปิด {/color}
    s "คุณครูบอกว่า {color=#ff3333}พลังเวทมนตร์ เป็นสิ่งที่อันตรายมาก"

    # 5. ข้อผิดพลาด: กำหนดค่าด้วย == แทนที่จะเป็น =
    $ player_mp == 100

    # 6. ข้อผิดพลาด: menu ขาดเครื่องหมาย :
    menu
        # 7. ข้อผิดพลาด: ตัวเลือกเมนูขาดโคลอน :
        "ทักทายซากุระกลับ"
            s "ยินดีที่ได้คุยกับเธอนะ!"
            jump chat_event

        "รีบเดินเข้าห้องเรียน":
            # 8. ข้อผิดพลาด: คำสั่งสะกดผิด (jummp -> jump)
            jummp classroom_event

label chat_event:
    s "ไว้เจอกันตอนพักเที่ยงนะ!"
    return

label classroom_event:
    mc "ทันเวลาพอดีเลย..."
    return
`,
      isBinary: false,
    },
  ],
  'clean_vn_script': [
    {
      name: 'script.rpy',
      path: 'game/script.rpy',
      content: `# สคริปต์เนื้อเรื่องเกม Ren'Py (Visual Novel Script)
# โครงสร้างมาตรฐาน พร้อมระบบตัวละคร ตัวเลือก และการบันทึกสถานะ

define e = Character("เอลีน่า", color="#c8ffc8")
define p = Character("ผู้กล้า", color="#ffd700")

default affection_points = 0
default has_ancient_key = False

label start:
    scene bg fantasy_forest with fade
    play music "audio/ambient_forest.ogg" fadein 1.0

    "แสงแดดส่องลอดผ่านกิ่งก้านของต้นไม้โบราณ ลมพัดพาความเย็นสบายมาทักทาย"

    show elena smiling at center with dissolve

    e "ยินดีต้อนรับสู่ป่าพฤกษาโบราณ! เจ้าพร้อมที่จะเริ่มการผจญภัยหรือยัง?"

    menu:
        "ข้าพร้อมตั้งนานแล้วล่ะ!":
            $ affection_points += 1
            show elena cheerful
            e "ยอดเยี่ยมมาก! ความกล้าหาญของเจ้าเปล่งประกายจริงๆ {w=0.5}ไปกันเถอะ!"
            jump explore_forest

        "ขอยังไม่แน่ใจ... ที่นี่ดูอันตรายจัง":
            show elena gentle
            e "ไม่ต้องกังวลไป ข้าจะคอยคุ้มครองเจ้าเอง"
            jump explore_forest

label explore_forest:
    scene bg ruins with wipeleft
    "ทั้งสองคนเดินทางมาถึงหน้าซากวิหารร้างโบราณ"

    show elena thinking at center
    e "ประตูบานนี้ถูกผนึกไว้ด้วยเวทมนตร์... เราต้องการกุญแจโบราณ"

    if has_ancient_key:
        e "เจ้ามีกุญแจอยู่แล้วนี่นา! ประตูเปิดออกแล้ว!"
        jump temple_inside
    else:
        e "ลองค้นหาแถวๆ รูปปั้นสิงโตดูก่อนเถอะ"
        $ has_ancient_key = True
        "คุณได้รับ [has_ancient_key] 'กุญแจโบราณ'!"
        jump temple_inside

label temple_inside:
    scene bg temple_hall with fade
    "ภายในวิหารเต็มไปด้วยอัญมณีและแสงสว่างเรืองรอง"
    e "ภารกิจแรกของเราสำเร็จแล้ว!"
    return
`,
      isBinary: false,
    },
    {
      name: 'options.rpy',
      path: 'game/options.rpy',
      content: `## ไฟล์ตั้งค่าเกม Ren'Py (options.rpy)
init -1:
    # ชื่อเกม
    define config.name = _("บันทึกการผจญภัยในแดนเวทมนตร์")
    define gui.show_name = True
    define config.version = "1.0.0"

    # โหมดนักพัฒนา (Developer Mode & Console)
    # สำหรับ Modding สามารถเปิดเป็น True ได้เสมอ
    define config.developer = True
    define config.console = True

    # ขนาดหน้าจอเกม
    define config.screen_width = 1920
    define config.screen_height = 1080

    # บันทึกข้อมูล
    define config.save_directory = "MagicAdventure-1730000000"
`,
      isBinary: false,
    },
  ],
  'android_apk_mod': [
    {
      name: '00_mod_console.rpy',
      path: 'assets/x-game/game/00_mod_console.rpy',
      content: `# โค้ด Mod สำหรับปลดล็อก Developer Console และ Quick Cheat Menu บน Android APK
# วางไฟล์นี้ไว้ใน game/ หรือ assets/x-game/game/

init 999 python:
    # 1. บังคับเปิดโหมดนักพัฒนา และคอนโซล (Shift + O หรือกด 4 นิ้วบน Android)
    config.developer = True
    config.console = True
    config.fast_skipping = True
    config.rollback_enabled = True

    # 2. ปลดล็อกแกลเลอรีภาพและฉากจบทั้งหมดใน persistent
    try:
        persistent._seen_images = {}
        persistent.unlocked_all_cg = True
    except:
        pass

# เพิ่มปุ่มทางลัด Mod Menu บนหน้าต่าง Quick Menu
screen mod_quick_button():
    zorder 100
    frame:
        xalign 0.98
        yalign 0.02
        background "#000000aa"
        padding (10, 6)
        textbutton "⚡ MOD MENU" action ShowMenu("mod_cheat_screen") text_color "#00ffcc" text_size 20

screen mod_cheat_screen():
    modal True
    tag menu
    add "#000000dd"

    vbox:
        xalign 0.5
        yalign 0.5
        spacing 15

        text "🛠️ REN'PY APK MOD CONTROLLER" size 34 color "#00ffcc" bold True

        textbutton "🔓 ปลดล็อก CGs / Gallery ทั้งหมด":
            action [SetVariable("persistent.unlocked_all", True), Notify("ปลดล็อกแกลเลอรีสำเร็จ!")]
            text_size 22

        textbutton "💰 เงินและแต้มสถานะสูงสุด (999,999)":
            action [Function(renpy.set_screen, "notify"), Notify("เพิ่มค่าสถานะแล้ว!")]
            text_size 22

        textbutton "🚀 ข้ามฉากแบบความเร็วสูง (Fast Skip)":
            action Skip(fast=True)
            text_size 22

        textbutton "❌ ปิดหน้าต่าง Mod":
            action Return()
            text_size 22
            text_color "#ff6666"
`,
      isBinary: false,
    },
    {
      name: 'AndroidManifest.xml',
      path: 'AndroidManifest.xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.renpy.visualnovel.game"
    android:versionCode="100"
    android:versionName="1.0.0">

    <uses-sdk
        android:minSdkVersion="21"
        android:targetSdkVersion="34" />

    <!-- สิทธิ์สำหรับจัดเก็บข้อมูลและอ่านไฟล์เซฟบน Android -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Ren'Py Visual Novel"
        android:requestLegacyExternalStorage="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name="org.renpy.android.PythonSDLActivity"
            android:configChanges="orientation|screenSize|keyboard|keyboardHidden"
            android:exported="true"
            android:label="Ren'Py Visual Novel"
            android:screenOrientation="sensorLandscape">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
      isBinary: false,
    },
  ],
};
