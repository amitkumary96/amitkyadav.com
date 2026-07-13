<?php
session_start();

if (!isset($_SESSION['authenticated']) || !$_SESSION['authenticated']) {
    header('Location: login.php');
    exit;
}

// Content directories
$directories = [
    'poet' => 'src/content/poet',
    'engineer' => 'src/content/engineer', 
    'life' => 'src/content/life'
];

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $category = $_POST['category'];
    $title = $_POST['title'];
    $date = $_POST['date'];
    $excerpt = $_POST['excerpt'];
    $content = $_POST['content'];
    
    if (isset($directories[$category])) {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/', '-', $title));
        $filename = date('Y-m-d') . '-' . $slug . '.md';
        $filepath = $directories[$category] . '/' . $filename;
        
        $frontmatter = "---\n";
        $frontmatter .= "title: \"$title\"\n";
        $frontmatter .= "date: \"$date\"\n";
        $frontmatter .= "category: \"$category\"\n";
        $frontmatter .= "excerpt: \"$excerpt\"\n";
        $frontmatter .= "---\n\n";
        $frontmatter .= $content;
        
        file_put_contents($filepath, $frontmatter);
        $success = "Post created successfully! It will be deployed on next push.";
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
    <nav class="bg-white shadow-md">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-xl font-bold">Admin Dashboard</h1>
            <a href="logout.php" class="text-red-500 hover:text-red-700">Logout</a>
        </div>
    </nav>
    
    <div class="container mx-auto px-4 py-8">
        <?php if (isset($success)): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($success); ?>
            </div>
        <?php endif; ?>
        
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-bold mb-6">Create New Post</h2>
            <form method="POST">
                <input type="hidden" name="action" value="create">
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">Category</label>
                    <select name="category" class="w-full px-3 py-2 border rounded-lg" required>
                        <option value="poet">Poet</option>
                        <option value="engineer">Engineer</option>
                        <option value="life">Life</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">Title</label>
                    <input type="text" name="title" class="w-full px-3 py-2 border rounded-lg" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">Date</label>
                    <input type="date" name="date" class="w-full px-3 py-2 border rounded-lg" value="<?php echo date('Y-m-d'); ?>" required>
                </div>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2">Excerpt</label>
                    <textarea name="excerpt" class="w-full px-3 py-2 border rounded-lg" rows="2" required></textarea>
                </div>
                
                <div class="mb-6">
                    <label class="block text-gray-700 mb-2">Content (Markdown)</label>
                    <textarea name="content" class="w-full px-3 py-2 border rounded-lg" rows="10" required></textarea>
                </div>
                
                <button type="submit" class="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600">Create Post</button>
            </form>
        </div>
        
        <div class="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 class="text-2xl font-bold mb-6">Existing Posts</h2>
            <?php foreach ($directories as $category => $dir): ?>
                <?php if (is_dir($dir)): ?>
                    <h3 class="text-xl font-semibold mb-4 capitalize"><?php echo $category; ?></h3>
                    <?php $files = glob($dir . '/*.md'); ?>
                    <?php if (count($files) > 0): ?>
                        <ul class="space-y-2 mb-6">
                            <?php foreach ($files as $file): ?>
                                <li class="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span><?php echo basename($file); ?></span>
                                    <a href="<?php echo $file; ?>" target="_blank" class="text-blue-500 hover:text-blue-700">View</a>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php else: ?>
                        <p class="text-gray-500 mb-6">No posts in this category.</p>
                    <?php endif; ?>
                <?php endif; ?>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>
