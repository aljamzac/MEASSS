import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ── MySQL Connection Pool ──────────────────────────────────────────────────
  const db = await mysql.createPool({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'database',
    waitForConnections: true,
    connectionLimit:       20,
    queueLimit:            0,
    enableKeepAlive:       true,
    keepAliveInitialDelay: 10000,
  });

  // Quick connectivity check
  try {
    await db.query('SELECT 1');
    console.log('✅  Connected to MySQL database');
  } catch (err) {
    console.error('❌  MySQL connection failed:', err);
    process.exit(1);
  }

  // Prevents server crash on unhandled DB promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('⚠️  Unhandled error (server kept alive):', reason);
  });

  app.use(express.json());

  // Wraps all async route handlers to return 500 instead of crashing
  const safe = (fn: Function) => async (req: any, res: any, next: any) => {
    try { await fn(req, res, next); } catch (e) { next(e); }
  };

  // ── STUDENTS ───────────────────────────────────────────────────────────────
  app.get('/api/students', safe(async (_req: any, res: any) => {
    const [rows]: any = await db.query('SELECT * FROM students');
    res.json(rows.map((s: any) => ({
      id:          s.student_id,
      name:        s.name,
      canTakeExam: !!s.can_take_exam,
      classId:     s.class_id,
    })));
  }));

  app.post('/api/students', safe(async (req: any, res: any) => {
    const { id, name, classId, canTakeExam } = req.body;
    await db.query(
      'INSERT INTO students (student_id, name, class_id, can_take_exam) VALUES (?, ?, ?, ?)',
      [id, name, classId || null, canTakeExam ? 1 : 0]
    );
    res.sendStatus(201);
  }));

  app.put('/api/students/:id', safe(async (req: any, res: any) => {
    const oldId = req.params.id;
    const { id, name, classId, canTakeExam } = req.body;
    const newId = String(id ?? oldId).trim();

    if (!newId || !name) {
      return res.status(400).json({ error: 'Student ID and name are required.' });
    }

    // ID unchanged: simple update
    if (newId === oldId) {
      await db.query(
        'UPDATE students SET name = ?, class_id = ?, can_take_exam = ? WHERE student_id = ?',
        [name, classId || null, canTakeExam ? 1 : 0, oldId]
      );
      return res.sendStatus(200);
    }

    // ID changed: examresults has a foreign key to students.student_id, so move
    // everything over inside one transaction (create new row -> repoint results -> delete old row).
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [existing]: any = await conn.query('SELECT 1 FROM students WHERE student_id = ?', [newId]);
      if (existing.length > 0) {
        await conn.rollback();
        return res.status(409).json({ error: `Student ID "${newId}" is already registered.` });
      }

      await conn.query(
        'INSERT INTO students (student_id, name, class_id, can_take_exam) VALUES (?, ?, ?, ?)',
        [newId, name, classId || null, canTakeExam ? 1 : 0]
      );
      await conn.query('UPDATE examresults SET student_id = ? WHERE student_id = ?', [newId, oldId]);
      await conn.query('DELETE FROM students WHERE student_id = ?', [oldId]);

      await conn.commit();
      res.sendStatus(200);
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }));

  // Used by the Allowed / Denied toggle in the Students tab (this route was missing before)
  app.patch('/api/students/:id/permission', safe(async (req: any, res: any) => {
    await db.query(
      'UPDATE students SET can_take_exam = ? WHERE student_id = ?',
      [req.body.canTakeExam ? 1 : 0, req.params.id]
    );
    res.sendStatus(200);
  }));

  app.delete('/api/students/:id', safe(async (req: any, res: any) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM examresults WHERE student_id = ?', [req.params.id]);
    await conn.query('DELETE FROM students WHERE student_id = ?', [req.params.id]);
    await conn.commit();
    res.sendStatus(200);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

app.delete('/api/classes/:id', safe(async (req: any, res: any) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE students SET class_id = NULL WHERE class_id = ?', [req.params.id]);
    await conn.query('DELETE FROM classes WHERE class_id = ?', [req.params.id]);
    await conn.commit();
    res.sendStatus(200);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

  // ── QUESTIONS ──────────────────────────────────────────────────────────────
  app.get('/api/questions', safe(async (_req: any, res: any) => {
    const [rows]: any = await db.query('SELECT * FROM questions');
    res.json(rows.map((q: any) => ({
      id:           q.question_id,
      category:     q.category,
      text:         q.question_text,
      options:      [q.option_1, q.option_2, q.option_3, q.option_4],
      correctIndex: q.correct_index,
    })));
  }));

  app.post('/api/questions', safe(async (req: any, res: any) => {
    const { id, category, text, options, correctIndex } = req.body;
    await db.query(
      `INSERT INTO questions
         (question_id, category, question_text, option_1, option_2, option_3, option_4, correct_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, category, text, options[0], options[1], options[2], options[3], correctIndex]
    );
    res.sendStatus(201);
  }));

  app.put('/api/questions/:id', safe(async (req: any, res: any) => {
    const { category, text, options, correctIndex } = req.body;
    await db.query(
      `UPDATE questions
       SET category = ?, question_text = ?,
           option_1 = ?, option_2 = ?, option_3 = ?, option_4 = ?,
           correct_index = ?
       WHERE question_id = ?`,
      [category, text, options[0], options[1], options[2], options[3], correctIndex, req.params.id]
    );
    res.sendStatus(200);
  }));

  app.delete('/api/questions/:id', safe(async (req: any, res: any) => {
    await db.query('DELETE FROM questions WHERE question_id = ?', [req.params.id]);
    res.sendStatus(200);
  }));

  // ── CLASSES ────────────────────────────────────────────────────────────────
  app.get('/api/classes', safe(async (_req: any, res: any) => {
    const [rows]: any = await db.query('SELECT * FROM classes');
    res.json(rows.map((c: any) => ({ id: c.class_id, name: c.class_name })));
  }));

  app.post('/api/classes', safe(async (req: any, res: any) => {
    const { id, name } = req.body;
    await db.query('INSERT INTO classes (class_id, class_name) VALUES (?, ?)', [id, name]);
    res.sendStatus(201);
  }));

  app.put('/api/classes/:id', safe(async (req: any, res: any) => {
    const { name } = req.body;
    await db.query('UPDATE classes SET class_name = ? WHERE class_id = ?', [name, req.params.id]);
    res.sendStatus(200);
  }));

  app.delete('/api/classes/:id', safe(async (req: any, res: any) => {
    await db.query('DELETE FROM classes WHERE class_id = ?', [req.params.id]);
    res.sendStatus(200);
  }));

  // ── ADMINS ─────────────────────────────────────────────────────────────────
  app.get('/api/admins', safe(async (_req: any, res: any) => {
    const [rows]: any = await db.query('SELECT * FROM admins');
    res.json(rows.map((a: any) => ({ id: a.admin_id, username: a.username, name: a.name })));
  }));

  app.post('/api/admins', safe(async (req: any, res: any) => {
    const { id, username, name } = req.body;
    await db.query('INSERT INTO admins (admin_id, username, name) VALUES (?, ?, ?)', [id, username, name]);
    res.sendStatus(201);
  }));

  app.put('/api/admins/:id', safe(async (req: any, res: any) => {
    const { username, name } = req.body;
    await db.query('UPDATE admins SET username = ?, name = ? WHERE admin_id = ?', [username, name, req.params.id]);
    res.sendStatus(200);
  }));

  app.delete('/api/admins/:id', safe(async (req: any, res: any) => {
    await db.query('DELETE FROM admins WHERE admin_id = ?', [req.params.id]);
    res.sendStatus(200);
  }));

  // ── EXAM RESULTS ───────────────────────────────────────────────────────────
  app.get('/api/results', safe(async (_req: any, res: any) => {
    const [rows]: any = await db.query(`
      SELECT r.*, s.name AS student_name
      FROM examresults r
      JOIN students s ON r.student_id = s.student_id
    `);
    res.json(rows.map((r: any) => ({
      id:          r.result_id,
      studentId:   r.student_id,
      studentName: r.student_name,
      score:       r.score,
      total:       r.total,
      date:        r.exam_date,
      answers:     r.answers_json ? JSON.parse(r.answers_json) : [],
    })));
  }));

  app.post('/api/results', safe(async (req: any, res: any) => {
    const { id, studentId, score, total, date, answers } = req.body;
    await db.query(
      `INSERT INTO examresults (result_id, student_id, score, total, exam_date, answers_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, studentId, score, total, date, JSON.stringify(answers)]
    );
    res.sendStatus(201);
  }));

  // ── Vite / Static ──────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Must be registered AFTER all routes — Express only routes errors to
  // middleware defined later in the stack than the handler that threw.
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error('API error:', err.message);
    res.status(500).json({ error: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀  Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);