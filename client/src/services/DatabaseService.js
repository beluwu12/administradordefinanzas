/**
 * DatabaseService - SQLite offline storage for Personal Finance App
 * 
 * This service manages local SQLite database for offline functionality.
 * Data is synced with the server when connection is available.
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'finanzas_db';

class DatabaseService {
    sqlite = null;
    db = null;
    platform = Capacitor.getPlatform();
    isInitialized = false;

    /**
     * Initialize the database connection and create tables
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            this.sqlite = new SQLiteConnection(CapacitorSQLite);

            // For web, we need to use jeep-sqlite (web worker)
            if (this.platform === 'web') {
                await customElements.whenDefined('jeep-sqlite');
                const jeepSqliteEl = document.querySelector('jeep-sqlite');
                if (jeepSqliteEl != null) {
                    await this.sqlite.initWebStore();
                }
            }

            // Create/open database
            this.db = await this.sqlite.createConnection(
                DB_NAME,
                false,
                'no-encryption',
                1,
                false
            );

            await this.db.open();
            await this.createTables();
            this.isInitialized = true;

            console.log('[DatabaseService] Initialized successfully');
        } catch (error) {
            console.error('[DatabaseService] Initialization error:', error);
            throw error;
        }
    }

    /**
     * Create all necessary tables
     */
    async createTables() {
        const statements = `
      -- Transactions table
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'USD',
        exchangeRate REAL,
        type TEXT NOT NULL,
        description TEXT,
        source TEXT,
        date TEXT,
        userId TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        syncStatus TEXT DEFAULT 'synced',
        deletedAt TEXT
      );

      -- Tags table
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        userId TEXT,
        createdAt TEXT,
        syncStatus TEXT DEFAULT 'synced'
      );

      -- Transaction-Tags junction table
      CREATE TABLE IF NOT EXISTS transaction_tags (
        transactionId TEXT,
        tagId TEXT,
        PRIMARY KEY (transactionId, tagId),
        FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
      );

      -- Goals table
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        totalCost REAL,
        currency TEXT DEFAULT 'USD',
        durationMonths INTEGER,
        monthlyAmount REAL,
        deadline TEXT,
        startDate TEXT,
        savedAmount REAL DEFAULT 0,
        tag TEXT,
        userId TEXT,
        createdAt TEXT,
        deletedAt TEXT,
        syncStatus TEXT DEFAULT 'synced'
      );

      -- Fixed Expenses table
      CREATE TABLE IF NOT EXISTS fixed_expenses (
        id TEXT PRIMARY KEY,
        amount REAL,
        currency TEXT DEFAULT 'USD',
        description TEXT,
        dueDay INTEGER,
        isActive INTEGER DEFAULT 1,
        userId TEXT,
        createdAt TEXT,
        deletedAt TEXT,
        syncStatus TEXT DEFAULT 'synced'
      );

      -- Sync Queue table - tracks pending operations
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT NOT NULL,
        payload TEXT,
        createdAt TEXT,
        attempts INTEGER DEFAULT 0
      );

      -- Last sync timestamp
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;

        await this.db.execute(statements);
    }

    // ============================================
    // TRANSACTIONS CRUD
    // ============================================

    async getTransactions(userId, options = {}) {
        const { limit = 50, offset = 0, type = null } = options;

        let query = `
      SELECT * FROM transactions 
      WHERE userId = ? AND deletedAt IS NULL
    `;
        const params = [userId];

        if (type) {
            query += ` AND type = ?`;
            params.push(type);
        }

        query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const result = await this.db.query(query, params);
        return result.values || [];
    }

    async getTransactionById(id) {
        const result = await this.db.query(
            'SELECT * FROM transactions WHERE id = ?',
            [id]
        );
        return result.values?.[0] || null;
    }

    async saveTransaction(transaction, isNew = true) {
        const now = new Date().toISOString();

        if (isNew) {
            const query = `
        INSERT INTO transactions (id, amount, currency, exchangeRate, type, description, source, date, userId, createdAt, updatedAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            await this.db.run(query, [
                transaction.id,
                transaction.amount,
                transaction.currency || 'USD',
                transaction.exchangeRate || null,
                transaction.type,
                transaction.description || '',
                transaction.source || null,
                transaction.date || now,
                transaction.userId,
                now,
                now,
                'pending'
            ]);

            // Queue for sync
            await this.queueSync('CREATE', 'transaction', transaction.id, transaction);
        } else {
            const query = `
        UPDATE transactions 
        SET amount = ?, currency = ?, exchangeRate = ?, type = ?, description = ?, source = ?, date = ?, updatedAt = ?, syncStatus = ?
        WHERE id = ?
      `;
            await this.db.run(query, [
                transaction.amount,
                transaction.currency || 'USD',
                transaction.exchangeRate || null,
                transaction.type,
                transaction.description || '',
                transaction.source || null,
                transaction.date,
                now,
                'pending',
                transaction.id
            ]);

            // Queue for sync
            await this.queueSync('UPDATE', 'transaction', transaction.id, transaction);
        }

        return transaction;
    }

    async deleteTransaction(id) {
        const now = new Date().toISOString();

        // Soft delete
        await this.db.run(
            'UPDATE transactions SET deletedAt = ?, syncStatus = ? WHERE id = ?',
            [now, 'pending', id]
        );

        await this.queueSync('DELETE', 'transaction', id, { id });
    }

    // ============================================
    // TAGS CRUD
    // ============================================

    async getTags(userId) {
        const result = await this.db.query(
            'SELECT * FROM tags WHERE userId = ? ORDER BY name ASC',
            [userId]
        );
        return result.values || [];
    }

    async saveTag(tag, isNew = true) {
        const now = new Date().toISOString();

        if (isNew) {
            await this.db.run(
                'INSERT INTO tags (id, name, color, userId, createdAt, syncStatus) VALUES (?, ?, ?, ?, ?, ?)',
                [tag.id, tag.name, tag.color || null, tag.userId, now, 'pending']
            );
            await this.queueSync('CREATE', 'tag', tag.id, tag);
        } else {
            await this.db.run(
                'UPDATE tags SET name = ?, color = ?, syncStatus = ? WHERE id = ?',
                [tag.name, tag.color || null, 'pending', tag.id]
            );
            await this.queueSync('UPDATE', 'tag', tag.id, tag);
        }

        return tag;
    }

    async deleteTag(id) {
        await this.db.run('DELETE FROM tags WHERE id = ?', [id]);
        await this.queueSync('DELETE', 'tag', id, { id });
    }

    // ============================================
    // GOALS CRUD
    // ============================================

    async getGoals(userId) {
        const result = await this.db.query(
            'SELECT * FROM goals WHERE userId = ? AND deletedAt IS NULL ORDER BY deadline ASC',
            [userId]
        );
        return result.values || [];
    }

    async saveGoal(goal, isNew = true) {
        const now = new Date().toISOString();

        if (isNew) {
            const query = `
        INSERT INTO goals (id, title, description, totalCost, currency, durationMonths, monthlyAmount, deadline, startDate, savedAmount, tag, userId, createdAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            await this.db.run(query, [
                goal.id,
                goal.title,
                goal.description || null,
                goal.totalCost,
                goal.currency || 'USD',
                goal.durationMonths,
                goal.monthlyAmount,
                goal.deadline || null,
                goal.startDate || now,
                goal.savedAmount || 0,
                goal.tag || null,
                goal.userId,
                now,
                'pending'
            ]);
            await this.queueSync('CREATE', 'goal', goal.id, goal);
        } else {
            const query = `
        UPDATE goals 
        SET title = ?, description = ?, totalCost = ?, currency = ?, durationMonths = ?, monthlyAmount = ?, deadline = ?, savedAmount = ?, tag = ?, syncStatus = ?
        WHERE id = ?
      `;
            await this.db.run(query, [
                goal.title,
                goal.description || null,
                goal.totalCost,
                goal.currency || 'USD',
                goal.durationMonths,
                goal.monthlyAmount,
                goal.deadline || null,
                goal.savedAmount || 0,
                goal.tag || null,
                'pending',
                goal.id
            ]);
            await this.queueSync('UPDATE', 'goal', goal.id, goal);
        }

        return goal;
    }

    async deleteGoal(id) {
        const now = new Date().toISOString();
        await this.db.run(
            'UPDATE goals SET deletedAt = ?, syncStatus = ? WHERE id = ?',
            [now, 'pending', id]
        );
        await this.queueSync('DELETE', 'goal', id, { id });
    }

    // ============================================
    // FIXED EXPENSES CRUD
    // ============================================

    async getFixedExpenses(userId) {
        const result = await this.db.query(
            'SELECT * FROM fixed_expenses WHERE userId = ? AND deletedAt IS NULL ORDER BY dueDay ASC',
            [userId]
        );
        return result.values || [];
    }

    async saveFixedExpense(expense, isNew = true) {
        const now = new Date().toISOString();

        if (isNew) {
            const query = `
        INSERT INTO fixed_expenses (id, amount, currency, description, dueDay, isActive, userId, createdAt, syncStatus)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            await this.db.run(query, [
                expense.id,
                expense.amount,
                expense.currency || 'USD',
                expense.description,
                expense.dueDay,
                expense.isActive ? 1 : 0,
                expense.userId,
                now,
                'pending'
            ]);
            await this.queueSync('CREATE', 'fixed_expense', expense.id, expense);
        } else {
            const query = `
        UPDATE fixed_expenses 
        SET amount = ?, currency = ?, description = ?, dueDay = ?, isActive = ?, syncStatus = ?
        WHERE id = ?
      `;
            await this.db.run(query, [
                expense.amount,
                expense.currency || 'USD',
                expense.description,
                expense.dueDay,
                expense.isActive ? 1 : 0,
                'pending',
                expense.id
            ]);
            await this.queueSync('UPDATE', 'fixed_expense', expense.id, expense);
        }

        return expense;
    }

    async deleteFixedExpense(id) {
        const now = new Date().toISOString();
        await this.db.run(
            'UPDATE fixed_expenses SET deletedAt = ?, syncStatus = ? WHERE id = ?',
            [now, 'pending', id]
        );
        await this.queueSync('DELETE', 'fixed_expense', id, { id });
    }

    // ============================================
    // SYNC QUEUE OPERATIONS
    // ============================================

    async queueSync(operation, entity, entityId, payload) {
        const now = new Date().toISOString();
        await this.db.run(
            'INSERT INTO sync_queue (operation, entity, entityId, payload, createdAt) VALUES (?, ?, ?, ?, ?)',
            [operation, entity, entityId, JSON.stringify(payload), now]
        );
    }

    async getPendingSync() {
        const result = await this.db.query(
            'SELECT * FROM sync_queue ORDER BY createdAt ASC',
            []
        );
        return result.values || [];
    }

    async removeSyncItem(id) {
        await this.db.run('DELETE FROM sync_queue WHERE id = ?', [id]);
    }

    async incrementSyncAttempt(id) {
        await this.db.run(
            'UPDATE sync_queue SET attempts = attempts + 1 WHERE id = ?',
            [id]
        );
    }

    async markAsSynced(entity, entityId) {
        const table = this.getTableName(entity);
        await this.db.run(
            `UPDATE ${table} SET syncStatus = 'synced' WHERE id = ?`,
            [entityId]
        );
    }

    getTableName(entity) {
        const map = {
            'transaction': 'transactions',
            'tag': 'tags',
            'goal': 'goals',
            'fixed_expense': 'fixed_expenses'
        };
        return map[entity] || entity;
    }

    // ============================================
    // SYNC METADATA
    // ============================================

    async getLastSyncTime() {
        const result = await this.db.query(
            "SELECT value FROM sync_metadata WHERE key = 'lastSync'",
            []
        );
        return result.values?.[0]?.value || null;
    }

    async setLastSyncTime(timestamp) {
        await this.db.run(
            "INSERT OR REPLACE INTO sync_metadata (key, value) VALUES ('lastSync', ?)",
            [timestamp]
        );
    }

    // ============================================
    // BULK OPERATIONS (for initial sync from server)
    // ============================================

    async bulkInsertTransactions(transactions, userId) {
        for (const t of transactions) {
            const exists = await this.getTransactionById(t.id);
            if (!exists) {
                await this.db.run(
                    `INSERT INTO transactions (id, amount, currency, exchangeRate, type, description, source, date, userId, createdAt, updatedAt, syncStatus, deletedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
                    [t.id, t.amount, t.currency, t.exchangeRate, t.type, t.description, t.source, t.date, userId, t.createdAt, t.createdAt, t.deletedAt]
                );
            }
        }
    }

    async bulkInsertTags(tags, userId) {
        for (const tag of tags) {
            const exists = await this.db.query('SELECT id FROM tags WHERE id = ?', [tag.id]);
            if (!exists.values?.length) {
                await this.db.run(
                    "INSERT INTO tags (id, name, color, userId, createdAt, syncStatus) VALUES (?, ?, ?, ?, ?, 'synced')",
                    [tag.id, tag.name, tag.color, userId, tag.createdAt]
                );
            }
        }
    }

    async bulkInsertGoals(goals, userId) {
        for (const g of goals) {
            const exists = await this.db.query('SELECT id FROM goals WHERE id = ?', [g.id]);
            if (!exists.values?.length) {
                await this.db.run(
                    `INSERT INTO goals (id, title, description, totalCost, currency, durationMonths, monthlyAmount, deadline, startDate, savedAmount, tag, userId, createdAt, syncStatus, deletedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?)`,
                    [g.id, g.title, g.description, g.totalCost, g.currency, g.durationMonths, g.monthlyAmount, g.deadline, g.startDate, g.savedAmount, g.tag, userId, g.createdAt, g.deletedAt]
                );
            }
        }
    }

    // ============================================
    // CLEANUP
    // ============================================

    async clearAllData() {
        await this.db.execute(`
      DELETE FROM transactions;
      DELETE FROM tags;
      DELETE FROM transaction_tags;
      DELETE FROM goals;
      DELETE FROM fixed_expenses;
      DELETE FROM sync_queue;
      DELETE FROM sync_metadata;
    `);
    }

    async close() {
        if (this.db) {
            await this.db.close();
            await this.sqlite.closeConnection(DB_NAME, false);
        }
    }
}

// Singleton instance
const databaseService = new DatabaseService();
export default databaseService;
