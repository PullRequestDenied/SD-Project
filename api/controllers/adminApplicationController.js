const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// GET /api/admin-applications/status/:userId
exports.checkApplication = async (req, res) => {
const userId = req.userId;

const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error checking applications:', error.message);
        return res.status(500).json({ error: error.message });
    }

    if (data && data.length > 0) {
        const latest = data[0];
        const accepted = latest.is_accepted === true;
        const denied = latest.is_denied === true;

        let status = '';
        if (accepted) status = 'accepted';
        else if (denied) status = 'denied';
        else status = 'pending';

        return res.json({
        alreadyApplied: true,
        status,
        application: latest,
        });
    } else {
        return res.json({
        alreadyApplied: false,
        status: '',
        application: null,
        });
    }
};


// GET /getroles/
exports.getRoleUsers = async (req, res) => {

    const { data, error } = await supabase
        .from('user_roles')
        .select('*');

    if (error) {
        console.error('Error checking applications:', error.message);
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
};

// GET /getauth/
exports.getAuthUsers = async (req, res) => {

    const { data, error } = await supabase
        .from('applications')
        .select('*');

    if (error) {
        console.error('Error checking applications:', error.message);
        return res.status(500).json({ error: error.message });
    }

    return res.json(data);
};

// POST /remove-admin/
exports.removeAdmin = async (req, res) => {
    const {id} = req.body;

    const { error: userError } = await supabase.from('applications')
        .update({ is_accepted: false })
        .eq('user_id', id);
    if (userError) {
        console.error('Error Changing application status:', userError.message);
        return res.status(500).json({ error: userError.message });
    }
    
    const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role', 'admin');

    if (error) {
        console.error('Error Removing Roles:', error.message);
        return res.status(500).json({ error: error.message });
    }

    return res.sendStatus(200);
};

// POST /add-admin/
exports.addAdmin = async (req, res) => {
    const {id} = req.body;

    const { error: userError } = await supabase.from('applications')
        .update({ is_accepted: true })
        .eq('user_id', id);
    if (userError) {
        console.error('Error Changing application status:', error.message);
        return res.status(500).json({ error: error.message });
    }
    
    const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: id, role: 'admin' });

    if (error) {
        console.error('Error Removing Roles:', error.message);
        return res.status(500).json({ error: error.message });
    }

    return res.sendStatus(200);
};

// PUT /reject-user/
exports.rejectUser = async (req, res) => {
    const {id} = req.body;

    const { error } = await supabase
        .from('applications')
        .update({ is_denied: true })
        .eq('user_id', id);

    if (error) {
        console.error('Failed to reject user:', error.message);
        return res.status(500).json({ error: error.message });
    }

    return res.sendStatus(200);
};

// POST /submit-application/
exports.submitApplication = async (req, res) => {
    const {id, user_name, motivation} = req.body;

    const { error } = await supabase.from('applications').insert([
          {
            user_id: id,
            user_name: user_name,
            motivation: motivation,
            is_accepted: false,
            is_denied: false,
          },
        ]);

    if (error) {
        return res.status(500).json({error});
    }

    return res.sendStatus(200);
};