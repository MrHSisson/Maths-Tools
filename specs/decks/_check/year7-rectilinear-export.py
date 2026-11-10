from pathlib import Path
import json, math, re, textwrap
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image

import argparse
parser=argparse.ArgumentParser(description='Export the verified Year 7 lesson bundle to PPTX and print PDFs.')
parser.add_argument('--work', type=Path, required=True, help='Directory containing lesson-bundle.json and lesson-assets/')
args=parser.parse_args()
ROOT=args.work; OUT=ROOT/'lesson-output'; ASSETS=ROOT/'lesson-assets'; OUT.mkdir(exist_ok=True)
B=json.loads((ROOT/'lesson-bundle.json').read_text()); A={a['id']:a for a in B['assets']}; G=B['groups']
NAVY='1E3A8A'; INK='0F172A'; MUTED='64748B'; TEAL='0F766E'; PURPLE='7C3AED'; LINE='CBD5E1'

def num(n): return str(int(n)) if float(n).is_integer() else f'{n:g}'
def area(poly): return abs(sum(p[0]*poly[(i+1)%len(poly)][1]-poly[(i+1)%len(poly)][0]*p[1] for i,p in enumerate(poly)))/2

def clean(s):
 s=s.replace('\\times','×').replace('\\,',' ').replace('\\;',' ').replace('\\mathrm{cm}','cm').replace('\\left','').replace('\\right','')
 return re.sub(r'\s+',' ',s.replace(',\\', '; ')).strip()

def calculations(a):
 rows=[]
 for w in a['working']:
  if w.get('label')=='So the missing side is:': rows.append('Missing length: '+clean(w['latex'])+' cm')
 d=a['drawing']; splits=[r for r in d['regions'] if r['id'].startswith('s')]; cuts=[r for r in d['regions'] if r['id'].startswith('c')]
 def dims(r):
  xs=[p[0] for p in r['pts']];ys=[p[1] for p in r['pts']];return max(xs)-min(xs),max(ys)-min(ys)
 if splits:
  vals=[]
  for i,r in enumerate(splits):
   w,h=dims(r);v=w*h;vals.append(v);rows.append(f'{chr(65+i)}: {num(w)} × {num(h)} = {num(v)} cm²')
  rows.append('Area: '+' + '.join(num(v) for v in vals)+' = '+a['answer']+' cm²')
 elif cuts:
  w,h=dims(next(r for r in d['regions'] if r['id']=='outer'));rows.append(f'Whole: {num(w)} × {num(h)} = {num(w*h)} cm²')
  vals=[]
  for i,r in enumerate(cuts):
   cw,ch=dims(r);vals.append(cw*ch);rows.append(f'Cut-out {i+1}: {num(cw)} × {num(ch)} = {num(cw*ch)} cm²')
  rows.append('Area: '+num(w*h)+' − '+' − '.join(num(v) for v in vals)+' = '+a['answer']+' cm²')
 return rows

def unknowns(a): return [e.get('value','') for e in a['drawing']['edges'] if e['kind']=='missing']

# Independent verification from the drawn polygons, rectangle regions and edge vectors.
verified=[]
for a in A.values():
 d=a['drawing']; actual=area(d['polys'][0])-sum(area(p) for p in d['polys'][1:]); assert actual==float(a['answer']),(a['id'],actual,a['answer'])
 splits=[r for r in d['regions'] if r['id'].startswith('s')]
 if splits: assert sum(area(r['pts']) for r in splits)==actual
 else:
  outer=next(r for r in d['regions'] if r['id']=='outer'); assert area(outer['pts'])-sum(area(r['pts']) for r in d['regions'] if r['id'].startswith('c'))==actual
 for e in d['edges']:
  if e['kind']=='missing':
   val=math.hypot(e['b'][0]-e['a'][0],e['b'][1]-e['a'][1]); assert val==float(e['value'].split()[0]); assert all(f['label']!=e['value'] for f in d['edges'] if f['kind']=='plain')
 boxw=max(p[0] for p in d['polys'][0])-min(p[0] for p in d['polys'][0]);boxh=max(p[1] for p in d['polys'][0])-min(p[1] for p in d['polys'][0]);assert boxw*boxh!=actual
 verified.append({'id':a['id'],'area':actual,'missing':unknowns(a),'wrong_enclosing_rectangle':boxw*boxh,'method':calculations(a)})
for group in ['practiceOne','practiceTwo','worksheet']:
 vals=[A[k]['answer'] for k in G[group]];assert len(vals)==len(set(vals)),(group,vals)
assert all(A[k]['item']['rectilinear']['reducedLabels'] for k in G['worksheet'])
(ROOT/'lesson-verification.json').write_text(json.dumps(verified,indent=2))

prs=Presentation();prs.slide_width=Inches(13.333333);prs.slide_height=Inches(7.5)
slide_manifest=[]
def text(sl,x,y,w,h,content,size=28,color=INK,bold=False,align=None):
 box=sl.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h));tf=box.text_frame;tf.word_wrap=True;tf.margin_left=Pt(0);tf.margin_right=Pt(0);tf.margin_top=Pt(0);tf.margin_bottom=Pt(0)
 for i,line in enumerate(content.split('\n')):
  p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.name='Arial';p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color);p.space_after=Pt(10)
  if align is not None:p.alignment=align
 return box

def base(title,section='Split and add',notes='',accent=NAVY):
 sl=prs.slides.add_slide(prs.slide_layouts[6]);sl.background.fill.solid();sl.background.fill.fore_color.rgb=RGBColor(255,255,255)
 bar=sl.shapes.add_shape(MSO_SHAPE.RECTANGLE,0,0,prs.slide_width,Inches(.09));bar.fill.solid();bar.fill.fore_color.rgb=RGBColor.from_string(accent);bar.line.fill.background()
 text(sl,.45,.25,11.9,.65,title,34,bold=True);text(sl,.45,7.16,11,.22,section+'  •  Area of rectilinear shapes',12,MUTED);text(sl,12.2,7.12,.65,.28,str(len(prs.slides)),12,MUTED,align=PP_ALIGN.RIGHT)
 sl.notes_slide.notes_text_frame.text=notes or 'Ask pupils to explain their method. Give thinking time before moving to the next slide.'
 slide_manifest.append({'number':len(prs.slides),'title':title,'section':section});return sl

def picture(sl,ident,variant='question',x=3.08,y=1.05,w=7.17,h=5.87):
 path=ASSETS/f'{ident}-{variant}.png';assert path.exists(),path
 sl.shapes.add_picture(str(path),Inches(x),Inches(y),width=Inches(w),height=Inches(h))

def qslide(ident,title,section,notes='',variant='question'):
 a=A[ident];sl=base(title,section,notes+'\nAnswer: '+a['answer']+' cm². '+('Missing: '+', '.join(unknowns(a))+'.' if unknowns(a) else ''))
 picture(sl,ident,variant);return sl

def aslide(ident,title,section,notes='',variant='answer',rows=None):
 a=A[ident];sl=base(title,section,notes+'\n'+ '\n'.join(calculations(a)))
 picture(sl,ident,variant,x=.28,y=1.05,w=6.85,h=5.6)
 rows=rows or calculations(a)
 for i,row in enumerate(rows):text(sl,7.45,1.55+i*.78,5.35,.74,row,27 if len(row)<40 else 24,color=NAVY if i==len(rows)-1 else INK,bold=i==len(rows)-1)
 return sl

# 0–5 minutes: start with the new idea, never a retrieval starter.
sl=base('Area of rectilinear shapes','Start here','0–5 minutes. Year 7 top set; pupils know rectangle area. No retrieval starter. Introduce the objective and ask where the first L-shape could be split.')
text(sl,.75,1.8,11.9,1.3,'Split. Calculate. Explain.',48,NAVY,True)
text(sl,.8,3.45,11.3,1.8,'Find areas by combining rectangles.\nThen compare with removing a cut-out.',30)
text(sl,.8,6.15,11.6,.45,'Year 7  •  All lengths in cm  •  Areas in cm²',20,MUTED)
sl=base('What makes a shape rectilinear?','The new idea','0–5 minutes. Read the formal definition. This is not a quiz of previous work. Ask pupils to identify right angles and suggest a split; do not calculate yet.')
text(sl,.65,1.55,5.5,2.6,'A rectilinear shape has straight sides meeting at right angles.',32,NAVY,True)
text(sl,.65,4.5,5.5,1.5,'Area measures the surface covered.\nWe use square units: cm².',27)
picture(sl,G['models']['split'],'outline',x=6.4,y=1.35,w=6.45,h=5.28)
qslide(G['models']['split'],'Where could we split this shape?','Discuss the split','Ask for a horizontal and a vertical split. Accept any split into rectangles that covers the shape once. Do not reveal the calculation yet.','outline')
# 5–13 minutes: model and two valid partitions.
sl=qslide(G['models']['split'],'Split into two rectangles','Model the method','5–13 minutes. Identify rectangles A and B and their dimensions. The horizontal split makes A = 8 × 4 and B = 5 × 2. Ask which two lengths belong to each rectangle.','split')
aslide(G['models']['split'],'Find the area of each rectangle','Model the method','Ask why we multiply within each rectangle. Do not add edge lengths.',variant='split',rows=calculations(A[G['models']['split']])[:-1])
aslide(G['models']['split'],'Add the two areas','Model the method','The regions have no gaps or overlap. Total 32 + 10 = 42 cm². Ask why the final unit is square centimetres.')
sl=base('Could a different split work?','Discuss the method','Compare the SAME outline using two partitions. Horizontal: 8 × 4 + 5 × 2 = 42. Vertical: 5 × 6 + 3 × 4 = 42. Both cover the whole shape exactly once. If pupils double-count a region, ask them to shade it.')
picture(sl,G['models']['split'],'split',x=.35,y=1.2,w=6.1,h=4.99);picture(sl,G['models']['split'],'alternate',x=6.85,y=1.2,w=6.1,h=4.99)
text(sl,.6,6.3,6.0,.55,'32 + 10 = 42 cm²',27,NAVY,True,PP_ALIGN.CENTER);text(sl,6.95,6.3,6.0,.55,'30 + 12 = 42 cm²',27,NAVY,True,PP_ALIGN.CENTER)
# 13–24 minutes: six chosen questions and two optional offline generator backups.
for i,k in enumerate(G['practiceOne']):
 support=['Split supplied: identify the two rectangles.','Use the supplied split, then calculate.','A rotated shape: orientation does not change area.','Choose your own split; check no gaps or overlap.','T-shape: separate the bar and stem.','Three rectangles: each part must be counted once.'][i]
 qslide(k,f'Practice A · question {i+1} of 6','Split and add','13–24 minutes. '+support+' Give thinking time or mini-whiteboard response. Check the answer on the next slide. If time is short, complete A1–A4 and return to A5–A6 next lesson.')
 aslide(k,f'Practice A · answer {i+1}','Split and add',support+' Watch for perimeter calculations, using dimensions from different rectangles, or missing one region.')
for i in [1,2]:
 k=f'live-given-{i}';qslide(k,f'Extra practice · example {i}','Optional general practice','Optional fixed offline backup. In the companion online deck, General practice generates fresh questions with reduced labels, all necessary lengths supplied/implied and the split initially hidden. Use only if pupils need another example.')
 aslide(k,f'Extra practice · answer {i}','Optional general practice')
# 24–35 minutes: explicit unknowns, with calculations before area.
qslide(G['models']['add'],'Find the missing length first','Missing lengths: addition','24–35 minutes. Reduced labels omit obvious equals; a ? marks something deliberately unknown. Ask which lengths join to make the whole. Say the length unit is cm, before finding an area in cm².')
aslide(G['models']['add'],'Join the parts to find the whole','Missing lengths: addition',variant='found',rows=[r for r in calculations(A[G['models']['add']]) if r.startswith('Missing')])
aslide(G['models']['add'],'Use the length to find the area','Missing lengths: addition')
qslide(G['models']['subtract'],'What must be taken from the whole?','Missing lengths: subtraction','Use the whole side and the known part. Ask why addition would be wrong here. Mark the found length on the shape before calculating area.')
aslide(G['models']['subtract'],'Subtract to find the missing part','Missing lengths: subtraction',variant='found',rows=[r for r in calculations(A[G['models']['subtract']]) if r.startswith('Missing')])
aslide(G['models']['subtract'],'Now calculate the area','Missing lengths: subtraction')
for i,k in enumerate(G['practiceTwo']):
 qslide(k,f'Practice B · question {i+1} of 6','Missing length, then area','24–35 minutes. Find the marked length first, write it on the diagram, then calculate area. B1–B2 use addition; B3–B6 use subtraction with varied orientation. These may continue next lesson if needed.')
 aslide(k,f'Practice B · answer {i+1}','Missing length, then area','Do not accept a correct missing length as a complete area answer. Ask pupils to distinguish cm from cm².')
for i in [1,2]:
 k=f'live-missing-{i}';qslide(k,f'Extra missing-length practice · {i}','Optional general practice','Optional offline backup from the live generator. Some examples have two missing lengths and can be used as extension. The companion deck can generate fresh examples.')
 aslide(k,f'Extra practice · answer {i}','Optional general practice')
# 35–43 minutes: discuss removal of a cut-out on the original shape.
qslide(G['models']['cutout'],'Could we remove a cut-out instead?','Discuss another method','35–43 minutes. Revisit the original 8 × 6 shape. Allow discussion before revealing the enclosing rectangle. Ask: What area does the whole rectangle include that the shape does not?','outline')
aslide(G['models']['cutout'],'Imagine the whole rectangle','Discuss another method',variant='whole',rows=['Whole rectangle:','8 × 6 = 48 cm²','Does 48 include any extra area?'])
aslide(G['models']['cutout'],'Identify the cut-out','Discuss another method',variant='cut',rows=['Missing corner:','3 × 2 = 6 cm²','What should we do with this area?'])
aslide(G['models']['cutout'],'Whole rectangle minus the cut-out','Discuss another method','The correct subtraction is AREA minus AREA, not subtracting lengths from an area. Compare 48 − 6 with 32 + 10. Both equal 42 cm².')
qslide(G['models']['choice'],'Which method would you choose? Why?','Choose an efficient method','This large enclosing rectangle has a small corner removed. Encourage either correct method; subtraction is convenient. Ask for a reason, not just an answer.','outline')
aslide(G['models']['choice'],'One efficient solution','Choose an efficient method','Accept another valid partition with the same total. Different correct methods should agree.')
# 43–57 minutes: independent worksheet, then a short exit check.
sl=base('Independent practice','Worksheet · 12 authored questions','43–57 minutes. Hand out the three-page worksheet. Section A has four prompted splits, B has four supplied splits, C has four independent questions. C9–C10 find marked lengths first; C11–C12 invite method choice. Resume here next lesson if needed. Do not show the appendix answer slides until checking.')
text(sl,.8,1.65,11.9,4.5,'A · Use the split and complete the calculations.\nB · Use the split and show your own working.\nC · Choose a method; find any ? lengths first.\n\nCheck: every part counted once, and area in cm².',30)
sl=base('What should we check?','Bring the ideas together','Use this as the bridge into the exit check. A pupil who can explain these checks is less likely to choose a formula by appearance.')
text(sl,.85,1.65,11.6,4.9,'1. Find any missing lengths first.\n2. Split and add, or find the whole minus the cut-out.\n3. Check there are no gaps or double-counted parts.\n4. Give the area in square units.',31)
qslide(G['models']['exit'],'Exit check · find the length and area','Check understanding','57–60 minutes. New question. Look for a correct missing length, valid area method and cm². If pupils are not ready, resume from the missing-length models next lesson.')
aslide(G['models']['exit'],'Exit check · worked answer','Check understanding')
sl=base('Exit check · explain the difference','Check understanding','Ask for one or two spoken/written sentences. Expected: when splitting, add disjoint component areas; when using an enclosing rectangle, subtract the extra cut-out area. Do not introduce another calculation.')
text(sl,.8,1.65,11.9,3.8,'Why do we add when we split a shape,\nbut subtract when we use a whole rectangle\nwith a cut-out?',34,NAVY,True)
sl=base('The same area, counted exactly once','Check understanding','Expected explanation. Use responses to decide the next lesson’s starting point. Optional practice and unfinished worksheet questions are the continuation, not new material.')
text(sl,.8,1.65,11.7,4.3,'Splitting: add the areas of rectangles inside the shape.\n\nCut-outs: the whole rectangle includes extra area, so remove it.\n\nBoth methods count the required area exactly once.',30)
for start in [0,6]:
 sl=base(f'Worksheet answers · {start+1}–{start+6}','Teacher appendix · display when ready','These answers are for checking after independent work. The separate worked-answer PDF includes diagrams and the full method for every question.')
 for j,k in enumerate(G['worksheet'][start:start+6]):
  x=.7+(j%2)*6.45;y=1.5+(j//2)*1.65;a=A[k]
  text(sl,x,y,5.9,.6,f'{start+j+1}.  {a["answer"]} cm²',30,NAVY,True)
  if unknowns(a):text(sl,x,y+.64,5.7,.65,'Missing length: '+', '.join(unknowns(a)),22)

ppt_path=OUT/'Rectilinear_Area_Lesson.pptx';prs.save(ppt_path)
(ROOT/'lesson-slide-manifest.json').write_text(json.dumps(slide_manifest,indent=2))

# Readable A4 worksheets: four questions on each page, fading support by section.
fontbase='/usr/share/fonts/truetype/dejavu/';pdfmetrics.registerFont(TTFont('DV',fontbase+'DejaVuSans.ttf'));pdfmetrics.registerFont(TTFont('DVB',fontbase+'DejaVuSans-Bold.ttf'))
W,H=A4

def pdftext(c,x,y,s,size=10,bold=False,color=INK):c.setFillColorRGB(*[int(color[i:i+2],16)/255 for i in (0,2,4)]);c.setFont('DVB' if bold else 'DV',size);c.drawString(x,y,s)

def lines(c,x,y,s,width=240,size=10,leading=15,bold=False):
 words=s.split();line='';out=[]
 for word in words:
  trial=(line+' '+word).strip()
  if pdfmetrics.stringWidth(trial,'DVB' if bold else 'DV',size)>width and line:out.append(line);line=word
  else:line=trial
 if line:out.append(line)
 for line in out:pdftext(c,x,y,line,size,bold);y-=leading
 return y

def worksheet(path,answers=False):
 c=canvas.Canvas(str(path),pagesize=A4);c.setTitle('Rectilinear area — '+('worked answers' if answers else 'worksheet'));c.setAuthor('Maths')
 labels=['A · Split and complete','B · Use the supplied split','C · Choose your method']
 instructions=['Complete each rectangle calculation, then find the total area.','Write your own area calculations. The split is provided.','Find any ? lengths first. Choose splitting or removing cut-outs.']
 for page in range(3):
  pdftext(c,30,H-34,'Area of rectilinear shapes',18,True,NAVY);pdftext(c,30,H-53,'Worked answers' if answers else 'Name: __________________________   Class: __________',10)
  pdftext(c,30,H-78,labels[page],12,True,TEAL);pdftext(c,30,H-96,instructions[page],9)
  gap=14;cw=(W-60-gap)/2;ch=337;top=H-112
  for j,k in enumerate(G['worksheet'][page*4:page*4+4]):
   idx=page*4+j+1;a=A[k];x=30+(j%2)*(cw+gap);yt=top-(j//2)*(ch+12);bottom=yt-ch
   c.setStrokeColorRGB(.80,.84,.88);c.setLineWidth(.6);c.roundRect(x,bottom,cw,ch,5,stroke=1,fill=0)
   pdftext(c,x+9,yt-17,str(idx)+'.',11,True)
   # The same small-mode SVG supplies both print diagrams; images remain crisp at over 300 dpi.
   variant='paperAnswer' if answers else 'paper';c.drawImage(str(ASSETS/f'{k}-{variant}.png'),x+8,yt-218,width=cw-16,height=198,preserveAspectRatio=True,anchor='c',mask='auto')
   y=yt-232
   if answers:
    for row in calculations(a):y=lines(c,x+10,y,row,cw-20,9.6,14,bold=row.startswith('Area:'))-3
   else:
    spec=a['item']['rectilinear']
    if spec.get('missingLength'):pdftext(c,x+10,y,'Missing length: __________ cm',10);y-=22
    if spec['scaffold']=='full':
     for r in [r for r in a['drawing']['regions'] if r['id'].startswith('s')]:
      pdftext(c,x+10,y,f'Rectangle {r["text"]}: ___ × ___ = ___ cm²',10);y-=23
     pdftext(c,x+10,y,'Total area: ______________ cm²',10)
    else:
     pdftext(c,x+10,y,'Show your method:',10);y-=16
     for z in range(2 if spec.get('missingLength') else 3):c.setStrokeColorRGB(.85,.87,.90);c.line(x+10,y,x+cw-10,y);y-=18
     pdftext(c,x+10,y,'Area: __________________ cm²',10)
   assert y>bottom+5,(k,'working runs off cell',y,bottom)
  pdftext(c,30,18,'All lengths in cm. Use the labels, not the apparent size of the drawing.',8,MUTED if False else False) if False else None
  pdftext(c,30,18,'All lengths in cm · Give areas in cm²',8,color=MUTED);pdftext(c,W-88,18,f'Page {page+1} / 3',8,color=MUTED);c.showPage()
 c.save()
worksheet(OUT/'Rectilinear_Area_Worksheet.pdf');worksheet(OUT/'Rectilinear_Area_Worked_Answers.pdf',True)

# Concise teacher route map and answer audit.
c=canvas.Canvas(str(OUT/'Rectilinear_Area_Teacher_Guide.pdf'),pagesize=A4);c.setTitle('Rectilinear area — teacher guide')
pdftext(c,34,H-40,'Teacher guide · Year 7 top set',18,True,NAVY);pdftext(c,34,H-62,'60 minutes · No retrieval starter · Optional practice can continue next lesson',9)
y=H-100
plan=[('0–5','Define rectilinear and discuss possible splits.'),('5–13','Model split / calculate / add; compare two valid splits.'),('13–24','Practice A (six questions); optional general-practice examples.'),('24–35','Model missing lengths by addition then subtraction; Practice B.'),('35–43','Discuss removing a cut-out. Compare 48 − 6 with 32 + 10.'),('43–57','Worksheet A–C: prompts fade; unknown lengths and method choice.'),('57–60','Exit question and explanation. Decide the next lesson’s starting point.')]
for time,desc in plan:pdftext(c,34,y,time+' min',11,True,TEAL);y=lines(c,120,y,desc,420,11,17)-21
y-=5;pdftext(c,34,y,'Look for these misconceptions',12,True,NAVY);y-=24
for s in ['Adding edge lengths instead of multiplying rectangle dimensions.','Combining a length from one rectangle with a length from another.','Using the enclosing rectangle without removing the extra area.','Adding when a missing part should be subtracted from a whole.','Stopping after finding the missing length, or writing cm for an area.']:y=lines(c,40,y,'• '+s,510,10,16)-8
pdftext(c,34,46,'PPTX uses separate question/build/answer slides for dependable offline reveal.',9);pdftext(c,34,30,'The companion editor deck contains the live generators; the PPTX includes fixed backups.',9);c.showPage()
pdftext(c,34,H-40,'Board question answers',18,True,NAVY);y=H-82
for label,group in [('Practice A',G['practiceOne']),('Practice B',G['practiceTwo'])]:
 pdftext(c,34,y,label,13,True,TEAL);y-=26
 for i,k in enumerate(group):
  a=A[k];s=f'{i+1}. Area = {a["answer"]} cm²'+('   |   Missing: '+', '.join(unknowns(a)) if unknowns(a) else '')
  pdftext(c,44,y,s,11);y-=24
 y-=15
exit_a=A[G['models']['exit']];pdftext(c,34,y,'Exit: '+exit_a['answer']+' cm²; missing '+', '.join(unknowns(exit_a)),12,True,NAVY);y-=35
for s in ['Support: keep supplied splits; have pupils mark each rectangle’s dimensions before multiplying.','Stretch: ask for a second split or a whole-minus-cut-out method and explain why the answers agree.','Pacing: general practice is optional. If the lesson overruns, resume unfinished practice or the worksheet; do not rush the cut-out explanation.']:
 y=lines(c,34,y,s,520,10,16)-15
c.showPage();c.save()
print(json.dumps({'ppt_slides':len(prs.slides),'questions_verified':len(verified),'worksheet_pages':3,'answers_pages':3,'files':[p.name for p in OUT.iterdir()]}))
