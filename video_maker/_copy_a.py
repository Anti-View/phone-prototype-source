import shutil, os

src = r'c:\Users\k\Desktop\毕设\小组件A'
files = os.listdir(src)
print(f'source files: {files}')

for dst in [r'c:\Users\k\Desktop\毕设\public\img\小组件A', r'c:\Users\k\Desktop\毕设\docs\img\小组件A']:
    os.makedirs(dst, exist_ok=True)
    for f in files:
        shutil.copy2(os.path.join(src, f), os.path.join(dst, f))
        print(f'{f} -> {dst}')
print('done')
