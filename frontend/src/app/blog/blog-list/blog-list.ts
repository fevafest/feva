import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../core/services/blog.service';
import { BlogPost } from '../../core/models/blog.model';
import { FileUrlPipe } from '../../shared/pipes/file-url.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FileUrlPipe, LoadingSpinnerComponent, EmptyStateComponent],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss',
})
export class BlogListComponent implements OnInit {
  readonly loading = signal(true);
  readonly posts = signal<BlogPost[]>([]);

  constructor(private readonly blogService: BlogService) {}

  ngOnInit(): void {
    this.blogService.list().subscribe({
      next: (res) => {
        this.posts.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
