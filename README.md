# Origamizake 折り紙酒

> 折り紙酒 (Origamizake)<br>
> `Sake drunk while watching Origami` <sup>[1](#naming)</sup>.

Origami runtime folded and rendered in JavaScript with threejs. Take a look in the [LOG.md](https://github.com/georgiee/origami/blob/master/LOG.md) for what's happening at the moment.

[georgiee.github.io/origami](https://georgiee.github.io/origami/)

## Project
My goal is to create an editor & a view mode. You should be able to create or modify models within the editor. The view mode was my initial project goal. In view mode the origami model should react to audio by showing different colors and animate from square paper to full model.

The editor is mostly done, it lacks some undo/redo functionality, saving as playbooks and some proper UI. But it's working very well so far. I have just started (07/2017) with the view mode so nothing yet to show. I will link a proper web version of the editor soon.

Features:
+ Fold with any angle & Creasing
+ Step through prerecorded playbooks
+ Crease Pattern View
+ Select Points in 3D throug the creasing view

Still pending:
+ Undo/Redo
+ Save as Playbook

![Crane Development Process](https://georgiee.github.io/origami/images/crane-editor.png)

## Inspiration & Code
Heavily based on [Origami Editor 3d (Java)](http://origamieditor3d.sourceforge.net/userguide/en/index.html)
as I'm porting, converting, refactoring with other project goals in mind. But I would never ever be able to do so without the mentioned project. I'm so glad that I found it and it's absolutely worth to check it out.

## Footnotes
<a name="naming">1</a> *Origamizake*<br>I think this word doesn't exist in Japanese. It was my poor invention when I was drunk from sake and programmed on it. Take `雪見酒` (*yukimizake, sake drunk while viewing a snowy scene​*) and `花見酒` (*hanamizake, sake drunk while viewing cherry blossoms​*) and mix it with Origami to get `origamizake` (*Sake drunk while watching Origami*).
