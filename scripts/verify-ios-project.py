"""Check target membership, offline assets and notification sound resources without Xcode."""
from pathlib import Path
import json, subprocess, wave, array, math, re

root=Path(__file__).resolve().parents[1]
project=root/'ios/App'
project_data=json.loads(subprocess.check_output(['plutil','-convert','json','-o','-',str(project/'App.xcodeproj/project.pbxproj')]))
objects=project_data['objects']
resolved={}
def visit(identifier,parent):
    item=objects[identifier]
    path=parent/item.get('path','')
    if item.get('sourceTree')=='SOURCE_ROOT':path=project/item.get('path','')
    if item['isa']=='PBXGroup':
        for child in item.get('children',[]):visit(child,path)
    elif item['isa']=='PBXFileReference':resolved[identifier]=path.resolve()
visit(objects[project_data['rootObject']]['mainGroup'],project)
def members(kind):
    return {resolved.get(objects[item]['fileRef']) for phase in objects.values() if phase['isa']==kind for item in phase.get('files',[]) if 'fileRef' in objects[item]}
sources=members('PBXSourcesBuildPhase');resources=members('PBXResourcesBuildPhase')
for name in ['ReminderPlan.swift','ReminderScheduler.swift','WaterNotificationsPlugin.swift','WaterBridgeController.swift']:
    path=root/'native'/name
    assert path in sources and path.is_file(), f'Missing native target source: {name}'
assert root/'native/PrivacyInfo.xcprivacy' in resources
icon=(project/'App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png').read_bytes()
assert icon[16:24]==(1024).to_bytes(4,'big')*2 and icon[25]==2, 'Icon must be 1024px RGB without alpha' 
sounds=sorted((root/'native/sounds').glob('*.wav'))
assert len(sounds)==12
rms={}
for path in sounds:
    assert path in resources, f'Not copied into notification bundle root: {path.name}'
    with wave.open(str(path)) as audio:
        assert audio.getnchannels()==1 and audio.getsampwidth()==2 and audio.getframerate()==44100
        assert 0<audio.getnframes()/audio.getframerate()<30
        samples=array.array('h',audio.readframes(audio.getnframes()))
        assert 0<max(abs(value) for value in samples)<32767
        rms[path.stem]=math.sqrt(sum(value*value for value in samples)/len(samples))
for sound in ['celesta','bamboo','chime','raindrop','singingbowl','morning']:
    assert rms[sound+'_soft']<rms[sound+'_clear']
config=json.loads((project/'App/capacitor.config.json').read_text())
assert 'server' not in config, 'Packaged app must load local assets, not a live development server'
html=(project/'App/public/index.html').read_text()
for asset in re.findall(r'(?:src|href)="(/[^"?#]+)"',html):
    assert (project/'App/public'/asset.lstrip('/')).is_file(), f'Missing bundled web asset: {asset}'
print('iOS project checks passed: 4 Swift sources, privacy manifest, 12 PCM sounds, offline web bundle.')
